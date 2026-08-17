using BabAlHara.Domain.Catalog;
using BabAlHara.Domain.Delivery;
using BabAlHara.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Persistence;

public sealed class DevelopmentDataSeeder(
    AppDbContext dbContext,
    UserManager<StaffUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager)
{
    public const string KitchenRole = "Kitchen";
    public const string ManagerRole = "Manager";
    public const string AdminRole = "Admin";
    public const string CashierRole = "Cashier";
    public const string DriverRole = "Driver";

    public const string KitchenEmail = "kitchen@bab-al-hara.local";

    public async Task SeedAsync(
        string environmentName,
        string kitchenPassword,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(environmentName, "Development", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Development data can only be seeded in Development.");
        }

        if (string.IsNullOrWhiteSpace(kitchenPassword))
        {
            throw new InvalidOperationException(
                "DevelopmentSeed:KitchenPassword must be supplied through an environment variable or user secret.");
        }

        if (!await dbContext.Categories.AnyAsync(cancellationToken))
        {
            dbContext.Categories.AddRange(CreateCategories());
            dbContext.MenuItems.AddRange(CreateMenuItems());
        }

        if (!await dbContext.DeliveryAreas.AnyAsync(cancellationToken))
        {
            dbContext.DeliveryAreas.AddRange(CreateDeliveryAreas());
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await SeedKitchenUserAsync(kitchenPassword);
    }

    private async Task SeedKitchenUserAsync(string kitchenPassword)
    {
        var roles = new[] { KitchenRole, ManagerRole, AdminRole, CashierRole, DriverRole };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var roleId = role == KitchenRole ? SeedIds.KitchenRoleId : Guid.NewGuid();
                var roleResult = await roleManager.CreateAsync(
                    new IdentityRole<Guid> { Id = roleId, Name = role });
                ThrowIfFailed(roleResult, $"create the {role} role");
            }
        }

        var user = await userManager.FindByEmailAsync(KitchenEmail);
        if (user is null)
        {
            user = new StaffUser
            {
                Id = SeedIds.KitchenUserId,
                UserName = KitchenEmail,
                Email = KitchenEmail,
                EmailConfirmed = true,
                DisplayName = "Kitchen",
            };
            var userResult = await userManager.CreateAsync(user, kitchenPassword);
            ThrowIfFailed(userResult, "create the development Kitchen user");
        }

        if (!await userManager.IsInRoleAsync(user, KitchenRole))
        {
            var roleResult = await userManager.AddToRoleAsync(user, KitchenRole);
            ThrowIfFailed(roleResult, "assign the Kitchen role");
        }
    }

    private static IReadOnlyList<Category> CreateCategories() =>
    [
        new(SeedIds.GrillsCategoryId, "المشاوي", "Grills", 10),
        new(SeedIds.SandwichesCategoryId, "السندوتشات", "Sandwiches", 20),
        new(SeedIds.SidesCategoryId, "المقبلات", "Sides", 30),
        new(SeedIds.DrinksCategoryId, "المشروبات", "Drinks", 40),
    ];

    private static IReadOnlyList<MenuItem> CreateMenuItems() =>
    [
        new(
            SeedIds.MixedGrillId,
            SeedIds.GrillsCategoryId,
            "مشكل مشاوي باب الحارة",
            "Bab Al Hara mixed grill",
            "كفتة وكباب وشيش طاووق مع خضار مشوية.",
            "Kofta, kebab, and shish tawook with grilled vegetables.",
            295m,
            "/images/menu/mixed-grill.webp",
            28,
            displayOrder: 10),
        new(
            SeedIds.ChickenGrillId,
            SeedIds.GrillsCategoryId,
            "نصف فرخة مشوية",
            "Half grilled chicken",
            "دجاج متبل على الفحم مع ثومية ومخلل.",
            "Charcoal-grilled marinated chicken with garlic sauce and pickles.",
            180m,
            "/images/menu/grilled-chicken.webp",
            25,
            displayOrder: 20),
        new(
            SeedIds.KoftaSandwichId,
            SeedIds.SandwichesCategoryId,
            "سندوتش كفتة",
            "Kofta sandwich",
            "كفتة مشوية في عيش بلدي مع طحينة وسلطة.",
            "Grilled kofta in baladi bread with tahini and salad.",
            85m,
            "/images/menu/kofta-sandwich.webp",
            14,
            displayOrder: 10),
        new(
            SeedIds.ShishTawookSandwichId,
            SeedIds.SandwichesCategoryId,
            "سندوتش شيش طاووق",
            "Shish tawook sandwich",
            "شيش طاووق مشوي مع ثومية وخيار مخلل.",
            "Grilled shish tawook with garlic sauce and pickled cucumber.",
            78m,
            "/images/menu/shish-sandwich.webp",
            14,
            displayOrder: 20),
        new(
            SeedIds.HummusId,
            SeedIds.SidesCategoryId,
            "حمص بالطحينة",
            "Hummus",
            "حمص كريمي بزيت الزيتون والبابريكا.",
            "Creamy hummus finished with olive oil and paprika.",
            48m,
            "/images/menu/hummus.webp",
            6,
            displayOrder: 10),
        new(
            SeedIds.FattoushId,
            SeedIds.SidesCategoryId,
            "فتوش",
            "Fattoush",
            "خضار طازجة وخبز محمص بدبس الرمان.",
            "Fresh vegetables and toasted bread with pomegranate molasses.",
            55m,
            "/images/menu/fattoush.webp",
            8,
            displayOrder: 20),
        new(
            SeedIds.MintLemonadeId,
            SeedIds.DrinksCategoryId,
            "ليمون بالنعناع",
            "Mint lemonade",
            "ليمون طازج ونعناع محضر عند الطلب.",
            "Fresh lemon and mint, blended to order.",
            42m,
            "/images/menu/mint-lemonade.webp",
            5,
            displayOrder: 10),
        new(
            SeedIds.TamarindId,
            SeedIds.DrinksCategoryId,
            "تمر هندي",
            "Tamarind",
            "مشروب تمر هندي شرقي بارد.",
            "Chilled traditional tamarind drink.",
            35m,
            "/images/menu/tamarind.webp",
            3,
            displayOrder: 20,
            isAvailable: false),
    ];

    private static IReadOnlyList<DeliveryArea> CreateDeliveryAreas() =>
    [
        new(SeedIds.NasrCityAreaId, "مدينة نصر", "Nasr City", 35m, 45),
        new(SeedIds.HeliopolisAreaId, "مصر الجديدة", "Heliopolis", 40m, 50),
        new(SeedIds.NewCairoAreaId, "القاهرة الجديدة", "New Cairo", 55m, 60),
    ];

    private static void ThrowIfFailed(IdentityResult result, string operation)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errors = string.Join("; ", result.Errors.Select(error => error.Code));
        throw new InvalidOperationException($"Could not {operation}: {errors}");
    }

    private static class SeedIds
    {
        public static readonly Guid GrillsCategoryId = new("10000000-0000-0000-0000-000000000001");
        public static readonly Guid SandwichesCategoryId = new("10000000-0000-0000-0000-000000000002");
        public static readonly Guid SidesCategoryId = new("10000000-0000-0000-0000-000000000003");
        public static readonly Guid DrinksCategoryId = new("10000000-0000-0000-0000-000000000004");
        public static readonly Guid MixedGrillId = new("20000000-0000-0000-0000-000000000001");
        public static readonly Guid ChickenGrillId = new("20000000-0000-0000-0000-000000000002");
        public static readonly Guid KoftaSandwichId = new("20000000-0000-0000-0000-000000000003");
        public static readonly Guid ShishTawookSandwichId = new("20000000-0000-0000-0000-000000000004");
        public static readonly Guid HummusId = new("20000000-0000-0000-0000-000000000005");
        public static readonly Guid FattoushId = new("20000000-0000-0000-0000-000000000006");
        public static readonly Guid MintLemonadeId = new("20000000-0000-0000-0000-000000000007");
        public static readonly Guid TamarindId = new("20000000-0000-0000-0000-000000000008");
        public static readonly Guid NasrCityAreaId = new("30000000-0000-0000-0000-000000000001");
        public static readonly Guid HeliopolisAreaId = new("30000000-0000-0000-0000-000000000002");
        public static readonly Guid NewCairoAreaId = new("30000000-0000-0000-0000-000000000003");
        public static readonly Guid KitchenRoleId = new("40000000-0000-0000-0000-000000000001");
        public static readonly Guid KitchenUserId = new("40000000-0000-0000-0000-000000000002");
    }
}
