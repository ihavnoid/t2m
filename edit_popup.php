<html>
<head>
    <script>
        function loadme() {
            let te = document.getElementById("textedit");
            let tem = document.getElementById("textedit_message");
            window.opener.editorPane.callbackFromPane(te, tem, window);
            let xf = () => {
                setTimeout(() => {
                    if(window.opener) {
                        xf();
                    } else {
                        window.close();
                    }
                }, 500);
            }
            xf();
        }
        window.onbeforeunload = function() {
            if (window.opener && !window.opener.closed) {
                window.opener.editorPane.callbackFromPane(
                    window.opener.document.getElementById("textedit"),
                    window.opener.document.getElementById("textedit_message"),
                    window.opener
                );
            }
        };
    </script>
    <?php include "p/header_styles.php"; ?>
</head>
<body onload="loadme()">
    <div id="textedit_message"></div>
    <div id="textedit" spellcheck="false" contenteditable="true"></div>

    <!-- Image Editor Modal -->
    <?php include "p/drawing_modal.php"; ?>
</body>
</html>
