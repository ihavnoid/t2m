/**
 * Handler for resizing the two panes. It handles the logic of the draggable bar in
 * the middle and the buttons to open collapsed panes.
 */
class PaneResizer {
    constructor() {
        this.$paneContainer = null;
        this.$dragbar = null;
        this.$editorPane = null;
        this.$viewerPane = null;
        this.$editorCollapseButton = null;
        this.$viewerCollapseButton = null;
        this.$floatButton = null;
        this.$body = null;

        this.minPaneWidth = 200;
        this.minCollapseWidth = 100;

        this.dragging = false;
        this.shouldSplitPanes = false;

        this.oldEditorPanePercentage = 35;
        this.oldViewerPanePercentage = 65;
        this.editorPanePercentage = 35;
        this.viewerPanePercentage = 65;

        this.editFloatMode = false;
    }

    init() {
        this.$paneContainer = $("#pane-container");
        this.$dragbar = $("#dragbar");
        this.$editorPane = $("#editor-pane");
        this.$viewerPane = $("#viewer-pane");
        this.$editorCollapseButton = $("#editor-collapse-button");
        this.$viewerCollapseButton = $("#viewer-collapse-button");
        this.$floatButton = $("#editor-float-button");
        this.$body = $("body");

        this.$editorCollapseButton.css("visibility", "visible");
        this.$viewerCollapseButton.css("visibility", "visible");
        this.$floatButton.css("visibility", "visible");

        this.oldEditorPanePercentage = this.editorPanePercentage;
        this.oldViewerPanePercentage = this.viewerPanePercentage;
        this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);

        $(window).on("resize", () => {
            this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
        });

        this.$editorCollapseButton.on("click touchstart", () => this.toggleViewer());
        this.$viewerCollapseButton.on("click touchstart", () => this.toggleEditor());
        this.$floatButton.on("click touchstart", () => this.clickFloatButton());

        this.$dragbar.on("mousedown", (mousedownEvent) => {
            this.dragging = true;
            this.$body.addClass("no-selection");
            const mouseDownPos = mousedownEvent.pageX;
            const initialLeftPaneWidth = this.$editorPane.width();

            $(document).on("mousemove", (mousemoveEvent) => {
                if (this.dragging) {
                    const deltaPageX = mousemoveEvent.pageX - mouseDownPos;
                    const unit = this.$paneContainer.width() / 100;
                    const newEditorPanePercentage = (initialLeftPaneWidth + deltaPageX) / unit;
                    const newViewerPanePercentage = 100 - newEditorPanePercentage;
                    this.editorPanePercentage = newEditorPanePercentage;
                    this.viewerPanePercentage = newViewerPanePercentage;
                    if (this.editorPanePercentage < this.minPaneWidth / unit) {
                        this.editorPanePercentage = this.minPaneWidth / unit;
                        this.viewerPanePercentage = 100 - this.editorPanePercentage;
                    }
                    if (this.viewerPanePercentage < this.minPaneWidth / unit) {
                        this.viewerPanePercentage = this.minPaneWidth / unit;
                        this.editorPanePercentage = 100 - this.viewerPanePercentage;
                    }
                    this.oldEditorPanePercentage = this.editorPanePercentage;
                    this.oldViewerPanePercentage = this.viewerPanePercentage;
                    this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
                }
            });

            $(document).on("mouseup", () => {
                if (this.dragging) {
                    this.dragging = false;
                    this.$body.removeClass("no-selection");
                    $(document).off("mousemove");
                }
            });
        });
    }

    resizePanesToPercentage(newEditorPanePercentage, newViewerPanePercentage) {
        if (Math.abs(newEditorPanePercentage + newViewerPanePercentage - 100) > 0.1) {
            console.warn("Error resizing panes, percentages don't add up. Resetting to 50% split.");
            this.editorPanePercentage = 50;
            this.viewerPanePercentage = 50;
            return this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
        }
        let newLeftWidth = (this.$paneContainer.width() / 100) * newEditorPanePercentage;
        let newRightWidth = (this.$paneContainer.width() / 100) * newViewerPanePercentage;
        this.$dragbar.show();
        if (newEditorPanePercentage === 0 || newViewerPanePercentage === 0) {
            if (this.shouldSplitPanes && this.$paneContainer.width() >= this.minPaneWidth * 2) {
                this.shouldSplitPanes = false;
                this.editorPanePercentage = this.oldEditorPanePercentage;
                this.viewerPanePercentage = this.oldViewerPanePercentage;
                return this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
            }
            if (newEditorPanePercentage === 0) {
                this.$dragbar.hide();
            }
        } else {
            if (this.$paneContainer.width() < this.minPaneWidth * 2) {
                this.shouldSplitPanes = true;
                this.editorPanePercentage = 100;
                this.viewerPanePercentage = 0;
                return this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
            }
            if (newLeftWidth < this.minCollapseWidth) {
                this.editorPanePercentage = 0;
                this.viewerPanePercentage = 100;
                return this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
            }
            if (newRightWidth < this.minCollapseWidth) {
                this.editorPanePercentage = 100;
                this.viewerPanePercentage = 0;
                return this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
            }
            if (newLeftWidth < this.minPaneWidth) {
                newLeftWidth = this.minPaneWidth;
                newRightWidth = this.$paneContainer.width() - newLeftWidth;
            }
            if (newRightWidth < this.minPaneWidth) {
                newRightWidth = this.minPaneWidth;
                newLeftWidth = this.$paneContainer.width() - newRightWidth;
            }
        }
        this.$editorPane.width(newLeftWidth);
        this.$viewerPane.width(newRightWidth);
        this.setCollapseButtonPositions();
        if (window.mindmap && window.mindmap.updateCanvasSize) {
            window.mindmap.updateCanvasSize();
        }
    }

    setCollapseButtonPositions() {
        if (this.$editorPane.width() === 0) {
            if (this.editFloatMode) {
                this.$viewerCollapseButton.hide();
            } else {
                this.$viewerCollapseButton.show();
            }
            this.$floatButton.hide();
        } else {
            this.$viewerCollapseButton.hide();
            this.$floatButton.show();
        }
        if (this.$viewerPane.width() === 0) {
            this.$editorCollapseButton.show();
        } else {
            this.$editorCollapseButton.hide();
        }
        let rightOffset = 29;
        this.$editorCollapseButton.css("left", `calc(100% - ${rightOffset}px)`);
        if (this.editorPanePercentage === 0) {
            this.$viewerCollapseButton.css("margin-left", "5px");
        } else {
            this.$viewerCollapseButton.css("margin-left", "10px");
        }
    }

    toggleEditor() {
        if (this.editorPanePercentage === 0) {
            if (this.$paneContainer.width() >= this.minPaneWidth * 2) {
                this.editorPanePercentage = this.oldEditorPanePercentage;
                this.viewerPanePercentage = this.oldViewerPanePercentage;
            } else {
                this.editorPanePercentage = 100;
                this.viewerPanePercentage = 0;
            }
        } else {
            this.editorPanePercentage = 0;
            this.viewerPanePercentage = 100;
        }
        this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
    }

    toggleViewer() {
        if (this.viewerPanePercentage === 0) {
            if (this.$paneContainer.width() >= this.minPaneWidth * 2) {
                this.editorPanePercentage = this.oldEditorPanePercentage;
                this.viewerPanePercentage = this.oldViewerPanePercentage;
            } else {
                this.editorPanePercentage = 0;
                this.viewerPanePercentage = 100;
            }
        } else {
            this.editorPanePercentage = 100;
            this.viewerPanePercentage = 0;
        }
        this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
    }

    editorUnfloat() {
        this.editorPanePercentage = this.oldEditorPanePercentage;
        this.viewerPanePercentage = this.oldViewerPanePercentage;
        this.editFloatMode = false;
        this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);
    }

    clickFloatButton() {
        this.oldEditorPanePercentage = this.editorPanePercentage;
        this.oldViewerPanePercentage = this.viewerPanePercentage;
        this.editorPanePercentage = 0;
        this.viewerPanePercentage = 100;
        this.editFloatMode = true;
        this.resizePanesToPercentage(this.editorPanePercentage, this.viewerPanePercentage);

        if (window.editorPane && window.editorPane.startFloatMode) {
            window.editorPane.startFloatMode(() => this.editorUnfloat());
        }
    }
}

export const paneResizer = new PaneResizer();
