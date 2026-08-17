using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRestaurantControl : Migration
    {
        private static readonly string[] RestaurantControlColumns =
        [
            "Id",
            "AcceptingOrders",
            "PauseMessageAr",
            "PauseMessageEn",
            "UpdatedAtUtc",
            "UpdatedByStaffDisplayName"
        ];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RestaurantControl",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AcceptingOrders = table.Column<bool>(type: "bit", nullable: false),
                    PauseMessageAr = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    PauseMessageEn = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset(7)", precision: 7, nullable: false),
                    UpdatedByStaffDisplayName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantControl", x => x.Id);
                });

            migrationBuilder.InsertData(
                schema: "app",
                table: "RestaurantControl",
                columns: RestaurantControlColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000001"), true, null, null, new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "System" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RestaurantControl",
                schema: "app");
        }
    }
}
