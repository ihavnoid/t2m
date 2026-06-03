/**
 * Logic for the top navigation bar (navbar) in the app.
 */
class Navbar {
    constructor() {
        this.idFunctionMap = {};
    }

    /**
     * Close all open dropdowns from the navbar.
     */
    closeDropdowns() {
        $(".navbar-dropdown .dropdown-content").hide();
    }

    /**
     * Set the state of the visibility icon of a dropdown item,
     * signaling whether something is displayed or not.
     * @param {string} buttonId
     * @param {boolean} visibility
     */
    setVisibilityIcon(buttonId, visibility) {
        const $icon = $(`#${buttonId} > i`);
        $icon.removeClass("fa-eye fa-eye-slash");
        if (visibility) {
            $icon.addClass("fa-eye");
        } else {
            $icon.addClass("fa-eye-slash");
        }
    }

    init(idFunctionMap) {
        this.idFunctionMap = idFunctionMap;

        const $links = $(".navbar a");

        // When the dropdown item is clicked, call the appropriate function.
        $links.on("click touchstart", (event) => {
            const $target = $(event.currentTarget);
            if ($target.attr("href") === "#") {
                event.preventDefault();
            }
            const id = $target.attr("id");
            if (id in this.idFunctionMap) {
                this.idFunctionMap[id]($target);
                this.closeDropdowns();
                event.stopPropagation();
            }
        });

        // Close all open dropdowns if the user clicks anywhere but the dropdown.
        $(document).on("click touchstart", (event) => {
            const $navbarDropdown = $(event.target).closest(".navbar-dropdown");
            if ($navbarDropdown.length !== 0) {
                // If it's a dropdown trigger, toggle it
                const $content = $navbarDropdown.find(".dropdown-content");
                const isVisible = $content.is(":visible");
                this.closeDropdowns();
                if (!isVisible) {
                    $content.show();
                }
                // Don't preventDefault here as it might break other interactions, 
                // but stop propagation if we are handling it.
            } else {
                this.closeDropdowns();
            }
        });
    }
}

export const navbar = new Navbar();
