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
        this.$editorCollapseButtonH = null;
        this.$editorCollapseButtonV = null;
        this.$viewerCollapseButtonH = null;
        this.$viewerCollapseButtonV = null;
        this.$floatButton = null;
        this.$body = null;

        this.minPaneSize = 200;
        this.minCollapseSize = 100;

        this.dragging = false;
        this.shouldSplitPanes = false;

        this.oldEditorPanePercentage = 35;
        this.oldViewerPanePercentage = 65;
        this.editorPanePercentage = 35;
        this.viewerPanePercentage = 65;

        this.editFloatMode = false;
        this.layoutMode = "horizontal";
    }

    init() {
        this.$paneContainer = $("#pane-container");
        this.$dragbar = $("#dragbar");
        this.$editorPane = $("#editor-pane");
        this.$viewerPane = $("#viewer-pane");
        this.$editorCollapseButtonH = $("#editor-collapse-button-h");
        this.$editorCollapseButtonV = $("#editor-collapse-button-v");
        this.$viewerCollapseButtonH = $("#viewer-collapse-button-h");
        this.$viewerCollapseButtonV = $("#viewer-collapse-button-v");
        this.$floatButton = $("#editor-float-button");
        this.$body = $("body");

        this.$editorCollapseButtonH.css("visibility", "visible");
        this.$editorCollapseButtonV.css("visibility", "visible");
        this.$viewerCollapseButtonH.css("visibility", "visible");
        this.$viewerCollapseButtonV.css("visibility", "visible");
        this.$floatButton.css("visibility", "visible");

        this.oldEditorPanePercentage = this.editorPanePercentage;
        this.oldViewerPanePercentage = this.viewerPanePercentage;
        this.resizePanesToPercentage(
            this.editorPanePercentage,
            this.viewerPanePercentage,
        );

        $(window).on("resize", () => {
            this.resizePanesToPercentage(
                this.editorPanePercentage,
                this.viewerPanePercentage,
            );
        });

        this.$editorCollapseButtonH.on("click touchstart", () =>
            this.toggleViewer(),
        );
        this.$editorCollapseButtonV.on("click touchstart", () =>
            this.toggleViewer(),
        );
        this.$viewerCollapseButtonH.on("click touchstart", () =>
            this.toggleEditor(),
        );
        this.$viewerCollapseButtonV.on("click touchstart", () =>
            this.toggleEditor(),
        );
        this.$floatButton.on("click touchstart", () => this.clickFloatButton());

        this.$dragbar.on("mousedown touchstart", (mousedownEvent) => {
            this.dragging = true;
            this.$body.addClass("no-selection");

            const isTouch = mousedownEvent.type === "touchstart";
            const isHoriz = this.layoutMode === "horizontal";
            const mouseDownPos = isHoriz
                ? isTouch
                    ? mousedownEvent.originalEvent.touches[0].pageX
                    : mousedownEvent.pageX
                : isTouch
                  ? mousedownEvent.originalEvent.touches[0].pageY
                  : mousedownEvent.pageY;

            const initialEditorSize = isHoriz
                ? this.$editorPane.width()
                : this.$editorPane.height();

            const moveEvent = isTouch ? "touchmove" : "mousemove";
            const upEvent = isTouch ? "touchend" : "mouseup";

            $(document).on(moveEvent, (ev) => {
                if (this.dragging) {
                    const currentPos = isHoriz
                        ? isTouch
                            ? ev.originalEvent.touches[0].pageX
                            : ev.pageX
                        : isTouch
                          ? ev.originalEvent.touches[0].pageY
                          : ev.pageY;

                    const delta = currentPos - mouseDownPos;
                    const containerSize = isHoriz
                        ? this.$paneContainer.width()
                        : this.$paneContainer.height();
                    const unit = containerSize / 100;

                    // In vertical mode, moving mouse down (positive delta) makes editor smaller
                    // because editor is placed at the bottom.
                    const actualDelta = isHoriz ? delta : -delta;
                    const newEditorPanePercentage =
                        (initialEditorSize + actualDelta) / unit;

                    this.editorPanePercentage = newEditorPanePercentage;
                    this.viewerPanePercentage = 100 - newEditorPanePercentage;

                    this.resizePanesToPercentage(
                        this.editorPanePercentage,
                        this.viewerPanePercentage,
                    );
                }
            });

            $(document).on(upEvent, () => {
                if (this.dragging) {
                    this.dragging = false;
                    this.$body.removeClass("no-selection");
                    $(document).off(moveEvent);
                    // Save percentage on drop, avoiding 0 or 100
                    if (
                        this.editorPanePercentage > 0 &&
                        this.editorPanePercentage < 100
                    ) {
                        this.oldEditorPanePercentage = this.editorPanePercentage;
                        this.oldViewerPanePercentage = this.viewerPanePercentage;
                    }
                }
            });
        });
    }

    toggleLayout() {
        this.layoutMode =
            this.layoutMode === "horizontal" ? "vertical" : "horizontal";

        // Clear styles to prevent cross-contamination between modes
        this.$editorPane.attr("style", "");
        this.$viewerPane.attr("style", "");
        this.$dragbar.attr("style", "");
        $("#viewer-container").attr("style", "");

        // Re-apply visibility for buttons
        if(this.layoutMode === "horizontal") {
            this.$editorCollapseButtonH.css("visibility", "visible");
            this.$viewerCollapseButtonH.css("visibility", "visible");
        } else {
            this.$editorCollapseButtonV.css("visibility", "visible");
            this.$viewerCollapseButtonV.css("visibility", "visible");
        }
        this.$floatButton.css("visibility", "visible");

        this.resizePanesToPercentage(
            this.editorPanePercentage,
            this.viewerPanePercentage,
        );
    }

    resizePanesToPercentage(newEditorPanePercentage, newViewerPanePercentage, force = false) {
        // Validate sum
        if (
            Math.abs(newEditorPanePercentage + newViewerPanePercentage - 100) >
            0.1
        ) {
            this.editorPanePercentage = 50;
            this.viewerPanePercentage = 50;
            return this.resizePanesToPercentage(50, 50, force);
        }

        const isHoriz = this.layoutMode === "horizontal";
        const containerSize = isHoriz
            ? this.$paneContainer.width()
            : this.$paneContainer.height();

        let newEditorSize = (containerSize / 100) * newEditorPanePercentage;
        let newViewerSize = (containerSize / 100) * newViewerPanePercentage;

        this.$dragbar.show();
        if (newEditorPanePercentage <= 0 || newViewerPanePercentage <= 0) {
            if (
                this.shouldSplitPanes &&
                containerSize >= this.minPaneSize * 2
            ) {
                this.shouldSplitPanes = false;
                this.editorPanePercentage = this.oldEditorPanePercentage || 35;
                this.viewerPanePercentage = this.oldViewerPanePercentage || 65;
                return this.resizePanesToPercentage(
                    this.editorPanePercentage,
                    this.viewerPanePercentage,
                    force
                );
            }
            if (newEditorPanePercentage <= 0) {
                this.$dragbar.hide();
                newEditorSize = 0;
                newViewerSize = containerSize;
            } else {
                newEditorSize = containerSize;
                newViewerSize = 0;
            }
        } else if (!force) {
            if (containerSize < this.minPaneSize * 2) {
                this.shouldSplitPanes = true;
                this.editorPanePercentage = 100;
                this.viewerPanePercentage = 0;
                return this.resizePanesToPercentage(100, 0, force);
            }
            if (newEditorSize < this.minCollapseSize) {
                this.editorPanePercentage = 0;
                this.viewerPanePercentage = 100;
                return this.resizePanesToPercentage(0, 100, force);
            }
            if (newViewerSize < this.minCollapseSize) {
                this.editorPanePercentage = 100;
                this.viewerPanePercentage = 0;
                return this.resizePanesToPercentage(100, 0, force);
            }
            if (newEditorSize < this.minPaneSize) {
                newEditorSize = this.minPaneSize;
                newViewerSize = containerSize - newEditorSize;
            }
            if (newViewerSize < this.minPaneSize) {
                newViewerSize = this.minPaneSize;
                newEditorSize = containerSize - newViewerSize;
            }
        }

        // Apply calculated sizes using inline styles
        if (isHoriz) {
            this.$editorPane.css({
                width: newEditorSize + "px",
                height: "",
                top: "",
                left: "",
                right: "",
            });
            this.$viewerPane.css({
                width: newViewerSize + "px",
                height: "",
                top: "",
                left: "",
                right: 0,
            });
            this.$dragbar.css({
                width: "",
                height: "",
                float: "",
                position: "",
                bottom: "",
                left: "",
                cursor: "",
                zIndex: "",
            });
            $("#viewer-container").css({ width: "", height: "", float: "" });
        } else {
            // Vertical mode: Viewer top, Editor bottom
            this.$viewerPane.css({
                width: "100%",
                height: newViewerSize + "px",
                top: "50px", // Compensate for navbar
                left: 0,
                right: "auto",
            });

            this.$dragbar.css({
                width: "100%",
                height: "6px",
                float: "none",
                position: "absolute",
                bottom: 0,
                left: 0,
                cursor: "row-resize",
                zIndex: 100,
                display:
                    newEditorSize === 0 || newViewerSize === 0
                        ? "none"
                        : "block",
            });

            $("#viewer-container").css({
                width: "100%",
                height: "calc(100% - 6px)",
                float: "none",
            });

            this.$editorPane.css({
                width: "100%",
                height: newEditorSize + "px",
                top: 50 + newViewerSize + "px", // Start directly under viewer
                left: 0,
                right: "auto",
            });
        }

        this.setCollapseButtonPositions(newEditorSize, newViewerSize);
        if (window.mindmap && window.mindmap.updateCanvasSize) {
            window.mindmap.updateCanvasSize();
        }
    }

    setCollapseButtonPositions(editorSize, viewerSize) {
        const isHoriz = this.layoutMode === "horizontal";
        const rightOffset = 29;

        if (isHoriz) {
            this.$viewerCollapseButtonV.hide();
            this.$editorCollapseButtonV.hide();
            // Visibility
            if (editorSize <= 0) {
                this.$viewerCollapseButtonH.show();
                this.$floatButton.hide();
            } else {
                this.$viewerCollapseButtonH.hide();
                this.$floatButton.show();
            }
            if (viewerSize <= 0) {
                this.$editorCollapseButtonH.show();
            } else {
                this.$editorCollapseButtonH.hide();
            }

            this.$editorCollapseButtonH.css({
                left: `calc(100% - ${rightOffset}px)`,
                top: "45%",
                bottom: "auto",
            });
            this.$editorCollapseButtonH.find("i").css("transform", "");

            this.$floatButton.css({
                left: `calc(100% - ${rightOffset}px)`,
                top: "0px",
                bottom: "auto",
            });

            this.$viewerCollapseButtonH.css({
                left: "5px",
                top: "45%",
                bottom: "auto",
            });
            this.$viewerCollapseButtonH.find("i").css("transform", "");
        } else {
            this.$viewerCollapseButtonH.hide();
            this.$editorCollapseButtonH.hide();
            // Visibility
            if (editorSize <= 0) {
                this.$viewerCollapseButtonV.show();
                this.$floatButton.hide();
            } else {
                this.$viewerCollapseButtonV.hide();
                this.$floatButton.show();
            }
            if (viewerSize <= 0) {
                this.$editorCollapseButtonV.show();
            } else {
                this.$editorCollapseButtonV.hide();
            }

            // using the bottom attribute doesn't work because the button is actually a hidden element on the layout with a zero size
            this.$viewerCollapseButtonV.css({
                left: "calc(50% - 30px)",
                bottom: "auto",
                top: "calc(100% - 35px)",
            });

            this.$editorCollapseButtonV.css({
                left: "calc(50% - 30px)",
                top: "5px",
                bottom: "auto",
            });

            // Keep float button top-right of editor
            this.$floatButton.css({
                left: `calc(100% - ${rightOffset}px)`,
                top: "0px",
                bottom: "auto",
            });
        }
    }

    toggleEditor() {
        if (this.editorPanePercentage <= 0) {
            const containerSize =
                this.layoutMode === "horizontal"
                    ? this.$paneContainer.width()
                    : this.$paneContainer.height();

            // Enforce minimum visible size
            const minPercent = (150 / containerSize) * 100;
            this.editorPanePercentage = Math.max(
                minPercent,
                this.oldEditorPanePercentage || 35,
            );
            this.viewerPanePercentage = 100 - this.editorPanePercentage;
        } else {
            this.editorPanePercentage = 0;
            this.viewerPanePercentage = 100;
        }
        this.resizePanesToPercentage(
            this.editorPanePercentage,
            this.viewerPanePercentage,
            true
        );
    }

    toggleViewer() {
        if (this.viewerPanePercentage <= 0) {
            const containerSize =
                this.layoutMode === "horizontal"
                    ? this.$paneContainer.width()
                    : this.$paneContainer.height();

            // Enforce minimum visible size
            const minPercent = (150 / containerSize) * 100;
            this.viewerPanePercentage = Math.max(
                minPercent,
                this.oldViewerPanePercentage || 65,
            );
            this.editorPanePercentage = 100 - this.viewerPanePercentage;
        } else {
            this.editorPanePercentage = 100;
            this.viewerPanePercentage = 0;
        }
        this.resizePanesToPercentage(
            this.editorPanePercentage,
            this.viewerPanePercentage,
            true
        );
    }

    editorUnfloat() {
        this.editorPanePercentage = this.oldEditorPanePercentage || 35;
        this.viewerPanePercentage = this.oldViewerPanePercentage || 65;
        this.editFloatMode = false;
        this.resizePanesToPercentage(
            this.editorPanePercentage,
            this.viewerPanePercentage,
            true
        );
    }

    clickFloatButton() {
        this.oldEditorPanePercentage = this.editorPanePercentage;
        this.oldViewerPanePercentage = this.viewerPanePercentage;
        this.editorPanePercentage = 0;
        this.viewerPanePercentage = 100;
        this.editFloatMode = true;
        this.resizePanesToPercentage(
            this.editorPanePercentage,
            this.viewerPanePercentage,
            true
        );

        if (window.editorPane && window.editorPane.startFloatMode) {
            window.editorPane.startFloatMode(() => this.editorUnfloat());
        }
    }
}

export const paneResizer = new PaneResizer();
