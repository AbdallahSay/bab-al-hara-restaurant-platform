using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class KitchenOperations : Migration
    {
        private static readonly string[] OrderHistoryColumns = ["OrderId", "ChangedAtUtc"];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                schema: "app",
                table: "Orders",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: Array.Empty<byte>());

            migrationBuilder.CreateTable(
                name: "OrderStatusHistories",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreviousStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NewStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ActorName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    ActorRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ChangedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset(7)", precision: 7, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderStatusHistories_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "app",
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_ChangedAtUtc",
                schema: "app",
                table: "OrderStatusHistories",
                column: "ChangedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_OrderId",
                schema: "app",
                table: "OrderStatusHistories",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_OrderId_ChangedAtUtc",
                schema: "app",
                table: "OrderStatusHistories",
                columns: OrderHistoryColumns);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderStatusHistories",
                schema: "app");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                schema: "app",
                table: "Orders");
        }
    }
}
