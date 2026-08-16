namespace BabAlHara.Domain.Ordering;

public sealed class OrderStatusHistory
{
    private OrderStatusHistory()
    {
    }

    public OrderStatusHistory(
        Guid id,
        Guid orderId,
        OrderStatus previousStatus,
        OrderStatus newStatus,
        string? actorId,
        string? actorName,
        string? actorRole,
        DateTimeOffset changedAtUtc,
        string? notes = null)
    {
        Id = id;
        OrderId = orderId;
        PreviousStatus = previousStatus;
        NewStatus = newStatus;
        ActorId = string.IsNullOrWhiteSpace(actorId) ? null : actorId.Trim();
        ActorName = string.IsNullOrWhiteSpace(actorName) ? null : actorName.Trim();
        ActorRole = string.IsNullOrWhiteSpace(actorRole) ? null : actorRole.Trim();
        ChangedAtUtc = changedAtUtc;
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }

    public Guid Id { get; private set; }

    public Guid OrderId { get; private set; }

    public Order? Order { get; private set; }

    public OrderStatus PreviousStatus { get; private set; }

    public OrderStatus NewStatus { get; private set; }

    public string? ActorId { get; private set; }

    public string? ActorName { get; private set; }

    public string? ActorRole { get; private set; }

    public DateTimeOffset ChangedAtUtc { get; private set; }

    public string? Notes { get; private set; }
}
