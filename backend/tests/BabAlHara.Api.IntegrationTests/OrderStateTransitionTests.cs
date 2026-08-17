using BabAlHara.Domain.Catalog;
using BabAlHara.Domain.Ordering;

namespace BabAlHara.Api.IntegrationTests;

public sealed class OrderStateTransitionTests
{
    [Fact]
    public void OrderInitialStatusIsPending()
    {
        var order = CreateSampleOrder();
        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Empty(order.StatusHistory);
    }

    [Fact]
    public void OrderCanonicalTransitionsSucceedAndRecordAuditHistory()
    {
        var order = CreateSampleOrder();
        var now = DateTimeOffset.UtcNow;

        // Pending -> Confirmed
        var h1 = order.TransitionStatus(
            OrderStatus.Confirmed,
            actorId: "user-1",
            actorName: "Chef Ahmad",
            actorRole: "Kitchen",
            changedAtUtc: now,
            notes: "Order confirmed by chef");

        Assert.Equal(OrderStatus.Confirmed, order.Status);
        Assert.Single(order.StatusHistory);
        Assert.Equal(OrderStatus.Pending, h1.PreviousStatus);
        Assert.Equal(OrderStatus.Confirmed, h1.NewStatus);
        Assert.Equal("user-1", h1.ActorId);
        Assert.Equal("Chef Ahmad", h1.ActorName);
        Assert.Equal("Kitchen", h1.ActorRole);
        Assert.Equal(now, h1.ChangedAtUtc);
        Assert.Equal("Order confirmed by chef", h1.Notes);

        // Confirmed -> Preparing
        var now2 = now.AddMinutes(1);
        var h2 = order.TransitionStatus(
            OrderStatus.Preparing,
            actorId: "user-1",
            actorName: "Chef Ahmad",
            actorRole: "Kitchen",
            changedAtUtc: now2,
            notes: "Grill started");

        Assert.Equal(OrderStatus.Preparing, order.Status);
        Assert.Equal(2, order.StatusHistory.Count);
        Assert.Equal(OrderStatus.Confirmed, h2.PreviousStatus);
        Assert.Equal(OrderStatus.Preparing, h2.NewStatus);

        // Preparing -> Ready
        var now3 = now.AddMinutes(10);
        var h3 = order.TransitionStatus(
            OrderStatus.Ready,
            actorId: "user-1",
            actorName: "Chef Ahmad",
            actorRole: "Kitchen",
            changedAtUtc: now3,
            notes: "Order boxed and ready");

        Assert.Equal(OrderStatus.Ready, order.Status);
        Assert.Equal(3, order.StatusHistory.Count);
        Assert.Equal(OrderStatus.Preparing, h3.PreviousStatus);
        Assert.Equal(OrderStatus.Ready, h3.NewStatus);
    }

    [Fact]
    public void OrderDirectPendingToPreparingThrowsInvalidOperationException()
    {
        var order = CreateSampleOrder();
        var now = DateTimeOffset.UtcNow;

        Assert.False(order.CanTransitionTo(OrderStatus.Preparing));
        var ex = Assert.Throws<InvalidOperationException>(() =>
            order.TransitionStatus(OrderStatus.Preparing, "user-1", "Chef Ahmad", "Kitchen", now));
        Assert.Contains("Cannot transition an order from Pending to Preparing", ex.Message);
    }

    [Theory]
    [InlineData(OrderStatus.Pending, OrderStatus.Preparing)]
    [InlineData(OrderStatus.Pending, OrderStatus.Ready)]
    [InlineData(OrderStatus.Pending, OrderStatus.OnTheWay)]
    [InlineData(OrderStatus.Pending, OrderStatus.Delivered)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Pending)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Ready)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.Delivered)]
    [InlineData(OrderStatus.Preparing, OrderStatus.Pending)]
    [InlineData(OrderStatus.Preparing, OrderStatus.Confirmed)]
    [InlineData(OrderStatus.Preparing, OrderStatus.Delivered)]
    [InlineData(OrderStatus.Ready, OrderStatus.Pending)]
    [InlineData(OrderStatus.Ready, OrderStatus.Confirmed)]
    [InlineData(OrderStatus.Ready, OrderStatus.Preparing)]
    [InlineData(OrderStatus.Ready, OrderStatus.Ready)]
    public void OrderIllegalTransitionsThrowInvalidOperationException(
        OrderStatus initialStatus,
        OrderStatus targetStatus)
    {
        var order = CreateOrderWithStatus(initialStatus);

        Assert.False(order.CanTransitionTo(targetStatus));
        var exception = Assert.Throws<InvalidOperationException>(() =>
            order.TransitionStatus(targetStatus, "user-1", "Chef Ahmad", "Kitchen", DateTimeOffset.UtcNow));

        Assert.Contains(initialStatus.ToString(), exception.Message);
        Assert.Contains(targetStatus.ToString(), exception.Message);
    }

    [Fact]
    public void MenuItemSetAvailabilityUpdatesIsAvailable()
    {
        var item = new MenuItem(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "كفتة",
            "Kofta",
            "وصف",
            "Desc",
            100m,
            "/img.webp",
            15,
            isAvailable: true);

        Assert.True(item.IsAvailable);

        item.SetAvailability(false);
        Assert.False(item.IsAvailable);

        item.SetAvailability(true);
        Assert.True(item.IsAvailable);
    }

    [Fact]
    public void AssignDriverSucceedsForReadyDeliveryOrder()
    {
        var order = CreateDeliveryOrderWithStatus(OrderStatus.Ready);
        var driverId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var history = order.AssignDriver(driverId, "Driver Tarek", "cashier-1", "Cashier", now);

        Assert.Equal(driverId, order.DriverId);
        Assert.Equal("Driver Tarek", order.DriverName);
        Assert.Equal(now, order.DriverAssignedAtUtc);
        Assert.Equal(OrderStatus.Ready, order.Status);
        Assert.Equal(OrderStatus.Ready, history.PreviousStatus);
        Assert.Equal(OrderStatus.Ready, history.NewStatus);
        Assert.Contains("Driver Tarek", history.Notes);
    }

    [Fact]
    public void AssignDriverThrowsWhenOrderIsTakeaway()
    {
        var order = CreateTakeawayOrderWithStatus(OrderStatus.Ready);
        var driverId = Guid.NewGuid();

        var ex = Assert.Throws<InvalidOperationException>(() =>
            order.AssignDriver(driverId, "Driver Tarek", "cashier-1", "Cashier", DateTimeOffset.UtcNow));
        Assert.Contains("Driver assignment is only allowed for delivery orders", ex.Message);
    }

    [Theory]
    [InlineData(OrderStatus.Pending)]
    [InlineData(OrderStatus.Confirmed)]
    [InlineData(OrderStatus.Preparing)]
    [InlineData(OrderStatus.Delivered)]
    public void AssignDriverThrowsWhenOrderIsNotReady(OrderStatus status)
    {
        var order = CreateDeliveryOrderWithStatus(status);
        var driverId = Guid.NewGuid();

        var ex = Assert.Throws<InvalidOperationException>(() =>
            order.AssignDriver(driverId, "Driver Tarek", "cashier-1", "Cashier", DateTimeOffset.UtcNow));
        Assert.Contains("Order must be Ready", ex.Message);
    }

    [Fact]
    public void AssignDriverThrowsForInvalidArguments()
    {
        var order = CreateDeliveryOrderWithStatus(OrderStatus.Ready);

        Assert.Throws<ArgumentException>(() =>
            order.AssignDriver(Guid.Empty, "Driver Tarek", "cashier-1", "Cashier", DateTimeOffset.UtcNow));

        Assert.Throws<ArgumentException>(() =>
            order.AssignDriver(Guid.NewGuid(), "", "cashier-1", "Cashier", DateTimeOffset.UtcNow));

        Assert.Throws<ArgumentException>(() =>
            order.AssignDriver(Guid.NewGuid(), "   ", "cashier-1", "Cashier", DateTimeOffset.UtcNow));
    }

    [Fact]
    public void DeliveryOrderTransitionsReadyToOnTheWayToDeliveredAndSettlesCash()
    {
        var order = CreateDeliveryOrderWithStatus(OrderStatus.Ready);
        var driverId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        order.AssignDriver(driverId, "Driver Tarek", "cashier-1", "Cashier", now);

        Assert.True(order.CanTransitionTo(OrderStatus.OnTheWay));
        var h1 = order.TransitionStatus(OrderStatus.OnTheWay, driverId.ToString(), "Driver Tarek", "Driver", now.AddMinutes(1));
        Assert.Equal(OrderStatus.OnTheWay, order.Status);
        Assert.Equal(PaymentStatus.Pending, order.PaymentStatus);

        Assert.True(order.CanTransitionTo(OrderStatus.Delivered));
        var h2 = order.TransitionStatus(OrderStatus.Delivered, driverId.ToString(), "Driver Tarek", "Driver", now.AddMinutes(15));
        Assert.Equal(OrderStatus.Delivered, order.Status);
        Assert.Equal(PaymentStatus.Paid, order.PaymentStatus);
    }

    [Fact]
    public void DeliveryOrderCannotTransitionReadyToDeliveredDirectly()
    {
        var order = CreateDeliveryOrderWithStatus(OrderStatus.Ready);
        var driverId = Guid.NewGuid();
        order.AssignDriver(driverId, "Driver Tarek", "cashier-1", "Cashier", DateTimeOffset.UtcNow);

        Assert.False(order.CanTransitionTo(OrderStatus.Delivered));
        var ex = Assert.Throws<InvalidOperationException>(() =>
            order.TransitionStatus(OrderStatus.Delivered, driverId.ToString(), "Driver Tarek", "Driver", DateTimeOffset.UtcNow));
        Assert.Contains("Cannot transition an order from Ready to Delivered", ex.Message);
    }

    [Fact]
    public void DeliveryOrderCannotTransitionReadyToOnTheWayWithoutDriver()
    {
        var order = CreateDeliveryOrderWithStatus(OrderStatus.Ready);

        Assert.False(order.CanTransitionTo(OrderStatus.OnTheWay));
        var ex = Assert.Throws<InvalidOperationException>(() =>
            order.TransitionStatus(OrderStatus.OnTheWay, "driver-1", "Driver Tarek", "Driver", DateTimeOffset.UtcNow));
        Assert.Contains("Cannot transition an order from Ready to OnTheWay", ex.Message);
    }

    [Fact]
    public void TakeawayOrderCannotTransitionReadyToOnTheWay()
    {
        var order = CreateTakeawayOrderWithStatus(OrderStatus.Ready);

        Assert.False(order.CanTransitionTo(OrderStatus.OnTheWay));
        var ex = Assert.Throws<InvalidOperationException>(() =>
            order.TransitionStatus(OrderStatus.OnTheWay, "driver-1", "Driver Tarek", "Driver", DateTimeOffset.UtcNow));
        Assert.Contains("Cannot transition an order from Ready to OnTheWay", ex.Message);
    }

    [Fact]
    public void TakeawayOrderCanTransitionReadyToDeliveredDirectlyAndSettlesCash()
    {
        var order = CreateTakeawayOrderWithStatus(OrderStatus.Ready);
        var now = DateTimeOffset.UtcNow;

        Assert.True(order.CanTransitionTo(OrderStatus.Delivered));
        order.TransitionStatus(OrderStatus.Delivered, "cashier-1", "Cashier Mona", "Cashier", now);

        Assert.Equal(OrderStatus.Delivered, order.Status);
        Assert.Equal(PaymentStatus.Paid, order.PaymentStatus);
    }

    [Theory]
    [InlineData(OrderStatus.Pending, OrderStatus.OnTheWay)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.OnTheWay)]
    [InlineData(OrderStatus.Preparing, OrderStatus.OnTheWay)]
    public void EarlyStatusesCannotTransitionToOnTheWay(OrderStatus initialStatus, OrderStatus targetStatus)
    {
        var order = CreateDeliveryOrderWithStatus(initialStatus);

        Assert.False(order.CanTransitionTo(targetStatus));
        var exception = Assert.Throws<InvalidOperationException>(() =>
            order.TransitionStatus(targetStatus, "driver-1", "Driver Tarek", "Driver", DateTimeOffset.UtcNow));
        Assert.Contains(initialStatus.ToString(), exception.Message);
    }

    private static Order CreateSampleTakeawayOrder()
    {
        var order = new Order(
            Guid.NewGuid(),
            "BH-TEST-000001",
            DateTimeOffset.UtcNow,
            OrderType.Takeaway,
            "Ahmed Ali",
            "01012345678",
            null,
            null,
            null,
            null,
            0m,
            "No spicy");

        order.AddItem(Guid.NewGuid(), Guid.NewGuid(), "سندوتش كفتة", "Kofta sandwich", 2, 85m);
        return order;
    }

    private static Order CreateSampleDeliveryOrder()
    {
        var order = new Order(
            Guid.NewGuid(),
            "BH-TEST-000002",
            DateTimeOffset.UtcNow,
            OrderType.Delivery,
            "Ahmed Ali",
            "01012345678",
            Guid.NewGuid(),
            "مدينة نصر",
            "Nasr City",
            "10 Street, Block 2",
            35m,
            "Fast please");

        order.AddItem(Guid.NewGuid(), Guid.NewGuid(), "مشكل مشاوي", "Mixed Grill", 1, 295m);
        return order;
    }

    private static Order CreateTakeawayOrderWithStatus(OrderStatus status)
    {
        var order = CreateSampleTakeawayOrder();
        if (status == OrderStatus.Pending) return order;

        order.TransitionTo(OrderStatus.Confirmed);
        if (status == OrderStatus.Confirmed) return order;

        order.TransitionTo(OrderStatus.Preparing);
        if (status == OrderStatus.Preparing) return order;

        order.TransitionTo(OrderStatus.Ready);
        if (status == OrderStatus.Ready) return order;

        if (status == OrderStatus.Delivered)
        {
            order.TransitionTo(OrderStatus.Delivered);
            return order;
        }

        return order;
    }

    private static Order CreateDeliveryOrderWithStatus(OrderStatus status)
    {
        var order = CreateSampleDeliveryOrder();
        if (status == OrderStatus.Pending) return order;

        order.TransitionTo(OrderStatus.Confirmed);
        if (status == OrderStatus.Confirmed) return order;

        order.TransitionTo(OrderStatus.Preparing);
        if (status == OrderStatus.Preparing) return order;

        order.TransitionTo(OrderStatus.Ready);
        if (status == OrderStatus.Ready) return order;

        if (status == OrderStatus.OnTheWay)
        {
            order.AssignDriver(Guid.NewGuid(), "Driver 1", "cashier", "Cashier", DateTimeOffset.UtcNow);
            order.TransitionTo(OrderStatus.OnTheWay);
            return order;
        }

        if (status == OrderStatus.Delivered)
        {
            order.AssignDriver(Guid.NewGuid(), "Driver 1", "cashier", "Cashier", DateTimeOffset.UtcNow);
            order.TransitionTo(OrderStatus.OnTheWay);
            order.TransitionTo(OrderStatus.Delivered);
            return order;
        }

        return order;
    }

    private static Order CreateSampleOrder() => CreateSampleTakeawayOrder();

    private static Order CreateOrderWithStatus(OrderStatus status) => CreateTakeawayOrderWithStatus(status);
}
