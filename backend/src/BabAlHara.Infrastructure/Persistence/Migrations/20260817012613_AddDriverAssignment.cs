using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverAssignment : Migration
    {
        private static readonly string[] DriverOrderIndexColumns = ["DriverId", "Status"];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DriverAssignedAtUtc",
                schema: "app",
                table: "Orders",
                type: "datetimeoffset(7)",
                precision: 7,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DriverId",
                schema: "app",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriverName",
                schema: "app",
                table: "Orders",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_DriverId_Status",
                schema: "app",
                table: "Orders",
                columns: DriverOrderIndexColumns);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_DriverId_Status",
                schema: "app",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DriverAssignedAtUtc",
                schema: "app",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DriverId",
                schema: "app",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DriverName",
                schema: "app",
                table: "Orders");
        }
    }
}
