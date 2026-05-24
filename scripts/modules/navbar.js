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
            console.log(id);
            if (id in this.idFunctionMap) {
                this.idFunctionMap[id]($target);
                this.closeDropdowns();
            }
        });

        // Close all open dropdowns if the user clicks anywhere but the dropdown.
        $(document).on("click", (event) => {
            this.closeDropdowns();
            const $navbarDropdown = $(event.target).parent(".navbar-dropdown");
            if ($navbarDropdown.length !== 0) {
                $navbarDropdown.find(".dropdown-content").show();
            }
        });
    }
}

export const navbar = new Navbar();
