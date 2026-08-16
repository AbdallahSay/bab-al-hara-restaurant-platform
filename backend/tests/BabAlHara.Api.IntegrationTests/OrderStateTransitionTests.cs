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

    private static Order CreateSampleOrder()
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

    private static Order CreateOrderWithStatus(OrderStatus status)
    {
        var order = CreateSampleOrder();
        if (status == OrderStatus.Pending)
        {
            return order;
        }

        if (status == OrderStatus.Confirmed)
        {
            order.TransitionTo(OrderStatus.Confirmed);
            return order;
        }

        if (status == OrderStatus.Preparing)
        {
            order.TransitionTo(OrderStatus.Confirmed);
            order.TransitionTo(OrderStatus.Preparing);
            return order;
        }

        if (status == OrderStatus.Ready)
        {
            order.TransitionTo(OrderStatus.Confirmed);
            order.TransitionTo(OrderStatus.Preparing);
            order.TransitionTo(OrderStatus.Ready);
            return order;
        }

        if (status == OrderStatus.OnTheWay)
        {
            order.TransitionTo(OrderStatus.Confirmed);
            order.TransitionTo(OrderStatus.Preparing);
            order.TransitionTo(OrderStatus.Ready);
            order.TransitionTo(OrderStatus.OnTheWay);
            return order;
        }

        if (status == OrderStatus.Delivered)
        {
            order.TransitionTo(OrderStatus.Confirmed);
            order.TransitionTo(OrderStatus.Preparing);
            order.TransitionTo(OrderStatus.Ready);
            order.TransitionTo(OrderStatus.OnTheWay);
            order.TransitionTo(OrderStatus.Delivered);
            return order;
        }

        return order;
    }
}
