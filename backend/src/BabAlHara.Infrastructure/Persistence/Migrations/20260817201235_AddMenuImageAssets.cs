using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuImageAssets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ImageAssetId",
                schema: "app",
                table: "MenuItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MenuImageAssets",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ContentLength = table.Column<long>(type: "bigint", nullable: false),
                    ContentHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Content = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset(7)", precision: 7, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuImageAssets", x => x.Id);
                });

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000001"),
                column: "ImageAssetId",
                value: null);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000002"),
                column: "ImageAssetId",
                value: null);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000003"),
                column: "ImageAssetId",
                value: null);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000004"),
                column: "ImageAssetId",
                value: null);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000005"),
                column: "ImageAssetId",
                value: null);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000006"),
                column: "ImageAssetId",
                value: null);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000007"),
                column: "ImageAssetId",
                value: null);

            migrationBuilder.UpdateData(
                schema: "app",
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000008"),
                column: "ImageAssetId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_ImageAssetId",
                schema: "app",
                table: "MenuItems",
                column: "ImageAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuImageAssets_ContentHash",
                schema: "app",
                table: "MenuImageAssets",
                column: "ContentHash");

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItems_MenuImageAssets_ImageAssetId",
                schema: "app",
                table: "MenuItems",
                column: "ImageAssetId",
                principalSchema: "app",
                principalTable: "MenuImageAssets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MenuItems_MenuImageAssets_ImageAssetId",
                schema: "app",
                table: "MenuItems");

            migrationBuilder.DropTable(
                name: "MenuImageAssets",
                schema: "app");

            migrationBuilder.DropIndex(
                name: "IX_MenuItems_ImageAssetId",
                schema: "app",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "ImageAssetId",
                schema: "app",
                table: "MenuItems");
        }
    }
}
