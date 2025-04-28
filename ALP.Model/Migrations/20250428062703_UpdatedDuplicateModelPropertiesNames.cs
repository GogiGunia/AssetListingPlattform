using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ALP.Model.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedDuplicateModelPropertiesNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "YachtListing_Model",
                table: "Listings",
                newName: "YachtModel");

            migrationBuilder.RenameColumn(
                name: "YachtListing_Location",
                table: "Listings",
                newName: "YachtLocation");

            migrationBuilder.RenameColumn(
                name: "Model",
                table: "Listings",
                newName: "AutoModel");

            migrationBuilder.RenameColumn(
                name: "Location",
                table: "Listings",
                newName: "JobLocation");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "YachtModel",
                table: "Listings",
                newName: "YachtListing_Model");

            migrationBuilder.RenameColumn(
                name: "YachtLocation",
                table: "Listings",
                newName: "YachtListing_Location");

            migrationBuilder.RenameColumn(
                name: "JobLocation",
                table: "Listings",
                newName: "Location");

            migrationBuilder.RenameColumn(
                name: "AutoModel",
                table: "Listings",
                newName: "Model");
        }
    }
}
