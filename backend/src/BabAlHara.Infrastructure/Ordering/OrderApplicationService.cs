using BabAlHara.Application.Kitchen;
using BabAlHara.Application.Ordering;
using BabAlHara.Application.Tracking;
using BabAlHara.Domain.Delivery;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BabAlHara.Infrastructure.Ordering;

public sealed partial class OrderApplicationService(
    AppDbContext dbContext,
    IOrderCodeGenerator orderCodeGenerator,
    INewOrderNotifier newOrderNotifier,
    ICustomerOrderTrackingService trackingService,
    TimeProvider timeProvider,
    ILogger<OrderApplicationService> logger) : IOrderApplicationService
{
    private const int MaximumLineCount = 50;
    private const int MaximumQuantity = 99;

    public async Task<CreateOrderOutcome> CreateAsync(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var validationFailure = ValidateCommand(command);
        if (validationFailure is not null)
        {
            return validationFailure;
        }

        var control = await dbContext.RestaurantControls
            .AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == BabAlHara.Domain.Ordering.RestaurantControl.SingletonId, cancellationToken);

        if (control is not null && !control.AcceptingOrders)
        {
            return CreateOrderOutcome.Failure(
                "restaurant_not_accepting_orders",
                "المطعم لا يستقبل طلبات جديدة مؤقتًا",
                isConflict: true);
        }

        var requestedItemIds = command.Items.Select(line => line.MenuItemId).ToArray();
        var menuItems = await dbContext.MenuItems
            .Include(item => item.Category)
            .Where(item => requestedItemIds.Contains(item.Id))
            .ToDictionaryAsync(item => item.Id, cancellationToken);

        foreach (var line in command.Items)
        {
            if (!menuItems.TryGetValue(line.MenuItemId, out var menuItem))
            {
                return CreateOrderOutcome.Failure(
                    "invalid_menu_item",
                    "One or more requested menu items do not exist.");
            }

            if (!menuItem.IsActive || !menuItem.Category.IsActive)
            {
                return CreateOrderOutcome.Failure(
                    "inactive_menu_item",
                    "One or more requested menu items are no longer active.",
                    isConflict: true);
            }

            if (!menuItem.IsAvailable)
            {
                return CreateOrderOutcome.Failure(
                    "unavailable_menu_item",
                    "One or more requested menu items are currently unavailable.",
                    isConflict: true);
            }
        }

        var deliveryAreaOutcome = await ResolveDeliveryAreaAsync(command, cancellationToken);
        if (deliveryAreaOutcome.Rejection is not null)
        {
            return CreateOrderOutcome.Failure(
                deliveryAreaOutcome.Rejection.Code,
                deliveryAreaOutcome.Rejection.Message,
                deliveryAreaOutcome.Rejection.IsConflict);
        }

        var now = timeProvider.GetUtcNow();
        var deliveryArea = deliveryAreaOutcome.Area;
        var order = new Order(
            Guid.NewGuid(),
            orderCodeGenerator.Create(now),
            now,
            command.OrderType,
            command.CustomerName,
            NormalizeEgyptianMobile(command.CustomerPhone),
            deliveryArea?.Id,
            deliveryArea?.NameAr,
            deliveryArea?.NameEn,
            command.Address,
            deliveryArea?.DeliveryFee ?? 0m,
            command.CustomerNote);

        foreach (var line in command.Items)
        {
            var menuItem = menuItems[line.MenuItemId];
            order.AddItem(
                Guid.NewGuid(),
                menuItem.Id,
                menuItem.NameAr,
                menuItem.NameEn,
                line.Quantity,
                menuItem.Price);
        }

        var rawToken = trackingService.GenerateTrackingToken();
        var tokenHash = trackingService.HashToken(rawToken);
        var expiresAtUtc = order.CreatedAt.AddDays(7);
        order.SetTrackingCredentials(tokenHash, expiresAtUtc);

        dbContext.Orders.Add(order);

        // A single SaveChanges call persists the complete aggregate in EF Core's automatic transaction.
        await dbContext.SaveChangesAsync(cancellationToken);

        var kitchenOrder = MapKitchenOrder(order);
        try
        {
            await newOrderNotifier.NotifyAsync(kitchenOrder, CancellationToken.None);
        }
        catch (Exception exception)
        {
            // Persistence is authoritative; a disconnected realtime channel is recovered by the queue API.
            LogRealtimeNotificationFailure(logger, order.PublicCode, exception);
        }

        return CreateOrderOutcome.Success(
            new CreatedOrderDto(
                order.PublicCode,
                order.CreatedAt,
                order.OrderType,
                order.Status,
                order.DeliveryAreaNameAr,
                order.DeliveryAreaNameEn,
                order.Address,
                order.Subtotal,
                order.DeliveryFee,
                order.Total,
                order.PaymentMethod,
                order.PaymentStatus),
            rawToken,
            expiresAtUtc);
    }

    private static CreateOrderOutcome? ValidateCommand(CreateOrderCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.CustomerName) || command.CustomerName.Trim().Length > 120)
        {
            return CreateOrderOutcome.Failure("invalid_customer_name", "A customer name is required.");
        }

        if (!TryNormalizeEgyptianMobile(command.CustomerPhone, out _))
        {
            return CreateOrderOutcome.Failure(
                "invalid_customer_phone",
                "A valid Egyptian mobile number is required.");
        }

        if (!Enum.IsDefined(command.OrderType))
        {
            return CreateOrderOutcome.Failure("invalid_order_type", "The order type is invalid.");
        }

        if (command.Items.Count is 0 or > MaximumLineCount)
        {
            return CreateOrderOutcome.Failure(
                "invalid_order_items",
                "An order must contain between 1 and 50 distinct items.");
        }

        if (command.Items.Any(line => line.Quantity is <= 0 or > MaximumQuantity))
        {
            return CreateOrderOutcome.Failure(
                "invalid_quantity",
                "Item quantities must be between 1 and 99.");
        }

        if (command.Items.Select(line => line.MenuItemId).Distinct().Count() != command.Items.Count)
        {
            return CreateOrderOutcome.Failure(
                "duplicate_menu_item",
                "Each menu item may appear only once in an order.");
        }

        if (!string.IsNullOrWhiteSpace(command.CustomerNote) && command.CustomerNote.Trim().Length > 500)
        {
            return CreateOrderOutcome.Failure("customer_note_too_long", "The customer note is too long.");
        }

        if (command.OrderType == OrderType.Takeaway &&
            (command.DeliveryAreaId.HasValue || !string.IsNullOrWhiteSpace(command.Address)))
        {
            return CreateOrderOutcome.Failure(
                "unexpected_delivery_details",
                "Takeaway orders cannot include delivery details.");
        }

        if (command.OrderType == OrderType.Delivery &&
            (!command.DeliveryAreaId.HasValue || string.IsNullOrWhiteSpace(command.Address)))
        {
            return CreateOrderOutcome.Failure(
                "missing_delivery_details",
                "Delivery orders require an active delivery area and address.");
        }

        if (!string.IsNullOrWhiteSpace(command.Address) && command.Address.Trim().Length > 500)
        {
            return CreateOrderOutcome.Failure("address_too_long", "The delivery address is too long.");
        }

        return null;
    }

    private async Task<DeliveryAreaOutcome> ResolveDeliveryAreaAsync(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        if (command.OrderType == OrderType.Takeaway)
        {
            return new DeliveryAreaOutcome(null, null);
        }

        var deliveryArea = await dbContext.DeliveryAreas.SingleOrDefaultAsync(
            area => area.Id == command.DeliveryAreaId,
            cancellationToken);
        if (deliveryArea is null)
        {
            return new DeliveryAreaOutcome(
                null,
                new OrderRejection("invalid_delivery_area", "The selected delivery area does not exist."));
        }

        if (!deliveryArea.IsActive)
        {
            return new DeliveryAreaOutcome(
                null,
                new OrderRejection(
                    "inactive_delivery_area",
                    "The selected delivery area is no longer active.",
                    IsConflict: true));
        }

        return new DeliveryAreaOutcome(deliveryArea, null);
    }

    private static KitchenOrderDto MapKitchenOrder(Order order) =>
        new(
            order.PublicCode,
            order.CreatedAt,
            order.OrderType,
            order.Status,
            order.CustomerName,
            order.DeliveryAreaNameAr,
            order.DeliveryAreaNameEn,
            order.Address,
            order.CustomerNote,
            order.RowVersion != null ? Convert.ToBase64String(order.RowVersion) : null,
            order.Items.Select(item => new KitchenOrderItemDto(
                item.ProductNameAr,
                item.ProductNameEn,
                item.Quantity)).ToList());

    private static string NormalizeEgyptianMobile(string value)
    {
        _ = TryNormalizeEgyptianMobile(value, out var normalized);
        return normalized;
    }

    private static bool TryNormalizeEgyptianMobile(string value, out string normalized)
    {
        normalized = string.Concat(value.Where(character => char.IsDigit(character) || character == '+'));
        if (normalized.StartsWith("+20", StringComparison.Ordinal))
        {
            normalized = $"0{normalized[3..]}";
        }
        else if (normalized.StartsWith("0020", StringComparison.Ordinal))
        {
            normalized = $"0{normalized[4..]}";
        }

        return normalized.Length == 11 &&
               normalized.StartsWith("01", StringComparison.Ordinal) &&
               normalized[2] is '0' or '1' or '2' or '5' &&
               normalized.All(char.IsDigit);
    }

    [LoggerMessage(
        EventId = 2100,
        Level = LogLevel.Warning,
        Message = "Order {PublicCode} was committed, but its kitchen realtime notification failed.")]
    private static partial void LogRealtimeNotificationFailure(
        ILogger logger,
        string publicCode,
        Exception exception);

    private sealed record DeliveryAreaOutcome(DeliveryArea? Area, OrderRejection? Rejection);
}
