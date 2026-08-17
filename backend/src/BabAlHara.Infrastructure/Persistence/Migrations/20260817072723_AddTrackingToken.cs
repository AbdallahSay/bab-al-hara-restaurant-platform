using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackingToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TrackingTokenHash",
                schema: "app",
                table: "Orders",
                type: "varchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TrackingTokenHash",
                schema: "app",
                table: "Orders",
                column: "TrackingTokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_TrackingTokenHash",
                schema: "app",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "TrackingTokenHash",
                schema: "app",
                table: "Orders");
        }
    }
}
