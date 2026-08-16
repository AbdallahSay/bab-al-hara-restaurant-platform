namespace BabAlHara.Domain.Ordering;

public sealed class Order
{
    private static readonly Dictionary<OrderStatus, HashSet<OrderStatus>> AllowedTransitions =
        new()
        {
            [OrderStatus.Pending] = [OrderStatus.Confirmed],
            [OrderStatus.Confirmed] = [OrderStatus.Preparing],
            [OrderStatus.Preparing] = [OrderStatus.Ready],
            [OrderStatus.Ready] = [OrderStatus.OnTheWay],
            [OrderStatus.OnTheWay] = [OrderStatus.Delivered],
        };

    private readonly List<OrderItem> items = [];
    private readonly List<OrderStatusHistory> statusHistory = [];

    private Order()
    {
    }

    public Order(
        Guid id,
        string publicCode,
        DateTimeOffset createdAt,
        OrderType orderType,
        string customerName,
        string customerPhone,
        Guid? deliveryAreaId,
        string? deliveryAreaNameAr,
        string? deliveryAreaNameEn,
        string? address,
        decimal deliveryFee,
        string? customerNote)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(deliveryFee);

        if (orderType == OrderType.Delivery &&
            (deliveryAreaId is null ||
             string.IsNullOrWhiteSpace(deliveryAreaNameAr) ||
             string.IsNullOrWhiteSpace(deliveryAreaNameEn) ||
             string.IsNullOrWhiteSpace(address)))
        {
            throw new ArgumentException("Delivery orders require an area and address.", nameof(orderType));
        }

        if (orderType == OrderType.Takeaway && (deliveryAreaId is not null || deliveryFee != 0))
        {
            throw new ArgumentException("Takeaway orders cannot include delivery details.", nameof(orderType));
        }

        Id = id;
        PublicCode = RequireText(publicCode, nameof(publicCode));
        CreatedAt = createdAt;
        OrderType = orderType;
        Status = OrderStatus.Pending;
        CustomerName = RequireText(customerName, nameof(customerName));
        CustomerPhone = RequireText(customerPhone, nameof(customerPhone));
        DeliveryAreaId = deliveryAreaId;
        DeliveryAreaNameAr = deliveryAreaNameAr?.Trim();
        DeliveryAreaNameEn = deliveryAreaNameEn?.Trim();
        Address = address?.Trim();
        DeliveryFee = deliveryFee;
        CustomerNote = string.IsNullOrWhiteSpace(customerNote) ? null : customerNote.Trim();
        PaymentMethod = PaymentMethod.Cash;
        PaymentStatus = PaymentStatus.Pending;
    }

    public Guid Id { get; private set; }

    public string PublicCode { get; private set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; private set; }

    public OrderType OrderType { get; private set; }

    public OrderStatus Status { get; private set; }

    public string CustomerName { get; private set; } = string.Empty;

    public string CustomerPhone { get; private set; } = string.Empty;

    public Guid? DeliveryAreaId { get; private set; }

    public Delivery.DeliveryArea? DeliveryArea { get; private set; }

    public string? DeliveryAreaNameAr { get; private set; }

    public string? DeliveryAreaNameEn { get; private set; }

    public string? Address { get; private set; }

    public decimal DeliveryFee { get; private set; }

    public decimal Subtotal { get; private set; }

    public decimal Total { get; private set; }

    public string? CustomerNote { get; private set; }

    public PaymentMethod PaymentMethod { get; private set; }

    public PaymentStatus PaymentStatus { get; private set; }

    public byte[] RowVersion { get; private set; } = [];

    public IReadOnlyCollection<OrderItem> Items => items;

    public IReadOnlyCollection<OrderStatusHistory> StatusHistory => statusHistory;

    public void AddItem(
        Guid id,
        Guid menuItemId,
        string productNameAr,
        string productNameEn,
        int quantity,
        decimal unitPrice)
    {
        var item = new OrderItem(
            id,
            menuItemId,
            productNameAr,
            productNameEn,
            quantity,
            unitPrice);
        items.Add(item);
        Subtotal += item.LineTotal;
        Total = Subtotal + DeliveryFee;
    }

    public bool CanTransitionTo(OrderStatus nextStatus) =>
        AllowedTransitions.TryGetValue(Status, out var allowed) && allowed.Contains(nextStatus);

    public OrderStatusHistory TransitionStatus(
        OrderStatus nextStatus,
        string? actorId,
        string? actorName,
        string? actorRole,
        DateTimeOffset changedAtUtc,
        string? notes = null)
    {
        if (!CanTransitionTo(nextStatus))
        {
            throw new InvalidOperationException($"Cannot transition an order from {Status} to {nextStatus}.");
        }

        var previousStatus = Status;
        Status = nextStatus;

        var history = new OrderStatusHistory(
            Guid.NewGuid(),
            Id,
            previousStatus,
            nextStatus,
            actorId,
            actorName,
            actorRole,
            changedAtUtc,
            notes);

        statusHistory.Add(history);
        return history;
    }

    public void TransitionTo(OrderStatus nextStatus) =>
        TransitionStatus(nextStatus, null, null, null, DateTimeOffset.UtcNow);

    private static string RequireText(string value, string parameterName) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("A non-empty value is required.", parameterName)
            : value.Trim();
}
