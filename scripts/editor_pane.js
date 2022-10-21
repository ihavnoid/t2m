// editor pane encapsulation

editorPane = (function() {
    function get() {
        return $("#textedit").val();
    }
    function set(x) {
        $("#textedit").val(x);
    }

    function getPos() {
        return [$("#textedit").get(0).selectionStart, $("#textedit").get(0).selectionEnd];
    }

    function setPos(p1, p2) {
        $("#textedit").get(0).selectionStart = p1;
        $("#textedit").get(0).selectionEnd = p2;
    }
    function on(evname, f) {
        return $("#textedit").on(evname, f);
    }

    function scrollToLine(line) {
        gg = parseInt($("textedit").css("line-height"))
        $("#textedit").scrollTop(line * gg)
    }
    return {
        get, set, getPos, setPos, on, scrollToLine
    };
}());
