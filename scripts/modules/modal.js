/**
 * Logic for the general modal UI.
 */
class Modal {
    constructor() {
        this.$tabs = null;
        this.$contents = null;
        this.$close = null;
    }

    init() {
        // Setup jQuery elements.
        this.$tabs = $(".modal-tabs > li");
        this.$contents = $(".tab-content");
        this.$close = $(".close-modal");

        // Close the modal
        this.$close.on("click touchstart", (event) => {
            $(event.currentTarget).closest(".modal").removeClass("active");
        });

        // Switch to the clicked tab
        this.$tabs.on("click touchstart", (event) => {
            const $target = $(event.currentTarget);
            this.$contents.removeClass("active");
            $(`#${$target.data("tab")}`).addClass("active");
            this.$tabs.removeClass("active");
            $target.addClass("active");
        });
    }

    show(modalId) {
        $(`#${modalId}`).addClass("active");
    }

    hide(modalId) {
        $(`#${modalId}`).removeClass("active");
    }
}

export const modal = new Modal();
