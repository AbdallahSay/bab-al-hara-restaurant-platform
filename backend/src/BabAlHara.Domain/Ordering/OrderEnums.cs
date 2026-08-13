namespace BabAlHara.Domain.Ordering;

public enum OrderType
{
    Takeaway = 1,
    Delivery = 2,
}

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    Preparing = 3,
    Ready = 4,
    OnTheWay = 5,
    Delivered = 6,
}

public enum PaymentMethod
{
    Cash = 1,
}

public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
}
