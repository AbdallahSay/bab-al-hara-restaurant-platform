using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CustomerOrdering : Migration
    {
        private static readonly string[] ActiveDisplayOrderColumns = ["IsActive", "DisplayOrder"];
        private static readonly string[] ActiveNameColumns = ["IsActive", "NameEn"];
        private static readonly string[] MenuQueryColumns = ["CategoryId", "IsActive", "IsAvailable"];
        private static readonly string[] KitchenQueueColumns = ["Status", "CreatedAt"];
        private static readonly bool[] KitchenQueueDescending = [false, true];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "app");

            migrationBuilder.CreateTable(
                name: "Categories",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.CheckConstraint("CK_Categories_DisplayOrder", "[DisplayOrder] >= 0");
                });

            migrationBuilder.CreateTable(
                name: "DeliveryAreas",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    DeliveryFee = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    EstimatedDeliveryMinutes = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryAreas", x => x.Id);
                    table.CheckConstraint("CK_DeliveryAreas_DeliveryFee", "[DeliveryFee] >= 0");
                    table.CheckConstraint("CK_DeliveryAreas_EstimatedDeliveryMinutes", "[EstimatedDeliveryMinutes] BETWEEN 1 AND 480");
                });

            migrationBuilder.CreateTable(
                name: "StaffRoles",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StaffUsers",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset(7)", precision: 7, nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MenuItems",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    DescriptionAr = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: false),
                    DescriptionEn = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ImageReference = table.Column<string>(type: "nvarchar(240)", maxLength: 240, nullable: false),
                    PreparationMinutes = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItems", x => x.Id);
                    table.CheckConstraint("CK_MenuItems_PreparationMinutes", "[PreparationMinutes] BETWEEN 1 AND 240");
                    table.CheckConstraint("CK_MenuItems_Price", "[Price] >= 0");
                    table.ForeignKey(
                        name: "FK_MenuItems_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "app",
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PublicCode = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset(7)", precision: 7, nullable: false),
                    OrderType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CustomerName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    CustomerPhone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    DeliveryAreaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeliveryAreaNameAr = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    DeliveryAreaNameEn = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DeliveryFee = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CustomerNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PaymentMethod = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PaymentStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.CheckConstraint("CK_Orders_DeliveryFee", "[DeliveryFee] >= 0");
                    table.CheckConstraint("CK_Orders_Subtotal", "[Subtotal] >= 0");
                    table.CheckConstraint("CK_Orders_Total", "[Total] = [Subtotal] + [DeliveryFee]");
                    table.ForeignKey(
                        name: "FK_Orders_DeliveryAreas_DeliveryAreaId",
                        column: x => x.DeliveryAreaId,
                        principalSchema: "app",
                        principalTable: "DeliveryAreas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StaffRoleClaims",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffRoleClaims_StaffRoles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "app",
                        principalTable: "StaffRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaffUserClaims",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffUserClaims_StaffUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "StaffUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaffUserLogins",
                schema: "app",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_StaffUserLogins_StaffUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "StaffUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaffUserRoles",
                schema: "app",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_StaffUserRoles_StaffRoles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "app",
                        principalTable: "StaffRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StaffUserRoles_StaffUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "StaffUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaffUserTokens",
                schema: "app",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_StaffUserTokens_StaffUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "app",
                        principalTable: "StaffUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderItems",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductNameAr = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    ProductNameEn = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => x.Id);
                    table.CheckConstraint("CK_OrderItems_LineTotal", "[LineTotal] = [UnitPrice] * [Quantity]");
                    table.CheckConstraint("CK_OrderItems_Quantity", "[Quantity] BETWEEN 1 AND 99");
                    table.CheckConstraint("CK_OrderItems_UnitPrice", "[UnitPrice] >= 0");
                    table.ForeignKey(
                        name: "FK_OrderItems_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalSchema: "app",
                        principalTable: "MenuItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "app",
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_IsActive_DisplayOrder",
                schema: "app",
                table: "Categories",
                columns: ActiveDisplayOrderColumns);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryAreas_IsActive_NameEn",
                schema: "app",
                table: "DeliveryAreas",
                columns: ActiveNameColumns);

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_CategoryId_IsActive_IsAvailable",
                schema: "app",
                table: "MenuItems",
                columns: MenuQueryColumns);

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_MenuItemId",
                schema: "app",
                table: "OrderItems",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                schema: "app",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedAt",
                schema: "app",
                table: "Orders",
                column: "CreatedAt",
                descending: []);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_DeliveryAreaId",
                schema: "app",
                table: "Orders",
                column: "DeliveryAreaId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PublicCode",
                schema: "app",
                table: "Orders",
                column: "PublicCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status_CreatedAt",
                schema: "app",
                table: "Orders",
                columns: KitchenQueueColumns,
                descending: KitchenQueueDescending);

            migrationBuilder.CreateIndex(
                name: "IX_StaffRoleClaims_RoleId",
                schema: "app",
                table: "StaffRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                schema: "app",
                table: "StaffRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_StaffUserClaims_UserId",
                schema: "app",
                table: "StaffUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffUserLogins_UserId",
                schema: "app",
                table: "StaffUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffUserRoles_RoleId",
                schema: "app",
                table: "StaffUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                schema: "app",
                table: "StaffUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                schema: "app",
                table: "StaffUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderItems",
                schema: "app");

            migrationBuilder.DropTable(
                name: "StaffRoleClaims",
                schema: "app");

            migrationBuilder.DropTable(
                name: "StaffUserClaims",
                schema: "app");

            migrationBuilder.DropTable(
                name: "StaffUserLogins",
                schema: "app");

            migrationBuilder.DropTable(
                name: "StaffUserRoles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "StaffUserTokens",
                schema: "app");

            migrationBuilder.DropTable(
                name: "MenuItems",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Orders",
                schema: "app");

            migrationBuilder.DropTable(
                name: "StaffRoles",
                schema: "app");

            migrationBuilder.DropTable(
                name: "StaffUsers",
                schema: "app");

            migrationBuilder.DropTable(
                name: "Categories",
                schema: "app");

            migrationBuilder.DropTable(
                name: "DeliveryAreas",
                schema: "app");
        }
    }
}
