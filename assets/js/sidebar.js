$(document).ready(function () {
    $("#mobileSidebarToggle").click(function () {
        $("#mobileSidebar").fadeToggle();
    });

    // Close sidebar when an option is clicked
    $("#mobileSidebar a").click(function () {
        $("#mobileSidebar").hide();
    });
});