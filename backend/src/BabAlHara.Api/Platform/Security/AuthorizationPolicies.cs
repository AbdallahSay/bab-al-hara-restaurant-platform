namespace BabAlHara.Api.Platform.Security;

public static class AuthorizationPolicies
{
    public const string Kitchen = "KitchenAccess";
    public const string Cashier = "CashierAccess";
    public const string Driver = "DriverAccess";
    public const string Management = "ManagementAccess";
}

public static class StaffAuthSchemes
{
    public const string Kitchen = "BabAlHara.Kitchen";
    public const string Cashier = "BabAlHara.Cashier";
    public const string Driver = "BabAlHara.Driver";
    public const string Management = "BabAlHara.Management";

    public static readonly string[] All = [Kitchen, Cashier, Driver, Management];
}

