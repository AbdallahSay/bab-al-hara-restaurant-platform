using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProductionCatalog : Migration
    {
        private static readonly string[] CategoryColumns = ["Id", "DisplayOrder", "IsActive", "NameAr", "NameEn"];
        private static readonly string[] DeliveryAreaColumns = ["Id", "DeliveryFee", "EstimatedDeliveryMinutes", "IsActive", "NameAr", "NameEn"];
        private static readonly string[] MenuItemColumns = ["Id", "CategoryId", "DescriptionAr", "DescriptionEn", "ImageReference", "IsActive", "IsAvailable", "NameAr", "NameEn", "PreparationMinutes", "Price"];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                schema: "app",
                table: "Categories",
                columns: CategoryColumns,
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), 10, true, "المشاوي", "Grills" },
                    { new Guid("10000000-0000-0000-0000-000000000002"), 20, true, "السندوتشات", "Sandwiches" },
                    { new Guid("10000000-0000-0000-0000-000000000003"), 30, true, "المقبلات", "Sides" },
                    { new Guid("10000000-0000-0000-0000-000000000004"), 40, true, "المشروبات", "Drinks" }
                });

            migrationBuilder.InsertData(
                schema: "app",
                table: "DeliveryAreas",
                columns: DeliveryAreaColumns,
                values: new object[,]
                {
                    { new Guid("30000000-0000-0000-0000-000000000001"), 35m, 45, true, "مدينة نصر", "Nasr City" },
                    { new Guid("30000000-0000-0000-0000-000000000002"), 40m, 50, true, "مصر الجديدة", "Heliopolis" },
                    { new Guid("30000000-0000-0000-0000-000000000003"), 55m, 60, true, "القاهرة الجديدة", "New Cairo" }
                });

            migrationBuilder.InsertData(
                schema: "app",
                table: "MenuItems",
                columns: MenuItemColumns,
                values: new object[,]
                {
                    { new Guid("20000000-0000-0000-0000-000000000001"), new Guid("10000000-0000-0000-0000-000000000001"), "كفتة وكباب وشيش طاووق مع خضار مشوية.", "Kofta, kebab, and shish tawook with grilled vegetables.", "/images/menu/mixed-grill.webp", true, true, "مشكل مشاوي باب الحارة", "Bab Al Hara mixed grill", 28, 295m },
                    { new Guid("20000000-0000-0000-0000-000000000002"), new Guid("10000000-0000-0000-0000-000000000001"), "دجاج متبل على الفحم مع ثومية ومخلل.", "Charcoal-grilled marinated chicken with garlic sauce and pickles.", "/images/menu/grilled-chicken.webp", true, true, "نصف فرخة مشوية", "Half grilled chicken", 25, 180m },
                    { new Guid("20000000-0000-0000-0000-000000000003"), new Guid("10000000-0000-0000-0000-000000000002"), "كفتة مشوية في عيش بلدي مع طحينة وسلطة.", "Grilled kofta in baladi bread with tahini and salad.", "/images/menu/kofta-sandwich.webp", true, true, "سندوتش كفتة", "Kofta sandwich", 14, 85m },
                    { new Guid("20000000-0000-0000-0000-000000000004"), new Guid("10000000-0000-0000-0000-000000000002"), "شيش طاووق مشوي مع ثومية وخيار مخلل.", "Grilled shish tawook with garlic sauce and pickled cucumber.", "/images/menu/shish-sandwich.webp", true, true, "سندوتش شيش طاووق", "Shish tawook sandwich", 14, 78m },
                    { new Guid("20000000-0000-0000-0000-000000000005"), new Guid("10000000-0000-0000-0000-000000000003"), "حمص كريمي بزيت الزيتون والبابريكا.", "Creamy hummus finished with olive oil and paprika.", "/images/menu/hummus.webp", true, true, "حمص بالطحينة", "Hummus", 6, 48m },
                    { new Guid("20000000-0000-0000-0000-000000000006"), new Guid("10000000-0000-0000-0000-000000000003"), "خضار طازجة وخبز محمص بدبس الرمان.", "Fresh vegetables and toasted bread with pomegranate molasses.", "/images/menu/fattoush.webp", true, true, "فتوش", "Fattoush", 8, 55m },
                    { new Guid("20000000-0000-0000-0000-000000000007"), new Guid("10000000-0000-0000-0000-000000000004"), "ليمون طازج ونعناع محضر عند الطلب.", "Fresh lemon and mint, blended to order.", "/images/menu/mint-lemonade.webp", true, true, "ليمون بالنعناع", "Mint lemonade", 5, 42m },
                    { new Guid("20000000-0000-0000-0000-000000000008"), new Guid("10000000-0000-0000-0000-000000000004"), "مشروب تمر هندي شرقي بارد.", "Chilled traditional tamarind drink.", "/images/menu/tamarind.webp", true, false, "تمر هندي", "Tamarind", 3, 35m }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "app",
                table: "DeliveryAreas",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "DeliveryAreas",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "DeliveryAreas",
                keyColumn: "Id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                schema: "app",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000004"));
        }
    }
}
