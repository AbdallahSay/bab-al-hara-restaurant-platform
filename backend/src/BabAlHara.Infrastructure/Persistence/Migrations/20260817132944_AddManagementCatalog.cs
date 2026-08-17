using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddManagementCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                schema: "app",
                table: "MenuItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                schema: "app",
                table: "MenuItems",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                schema: "app",
                table: "Categories",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000001"),
                column: "DisplayOrder",
                value: 10);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000002"),
                column: "DisplayOrder",
                value: 20);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000003"),
                column: "DisplayOrder",
                value: 10);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000004"),
                column: "DisplayOrder",
                value: 20);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000005"),
                column: "DisplayOrder",
                value: 10);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000006"),
                column: "DisplayOrder",
                value: 20);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000007"),
                column: "DisplayOrder",
                value: 10);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000008"),
                column: "DisplayOrder",
                value: 20);

            migrationBuilder.AddCheckConstraint(
                name: "CK_MenuItems_DisplayOrder",
                schema: "app",
                table: "MenuItems",
                sql: "[DisplayOrder] >= 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_MenuItems_DisplayOrder",
                schema: "app",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                schema: "app",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                schema: "app",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                schema: "app",
                table: "Categories");
        }
    }
}
