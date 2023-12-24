$(document).ready(function () {
    $("#mobileSidebarToggle").click(function () {
        $("#mobileSidebar").fadeToggle();
    });

    function closeSidebar() {
        $("#mobileSidebar").fadeOut();
    }
});
