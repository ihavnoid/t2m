<?php $base = "/";?>

<!DOCTYPE HTML>
<html>
<style>
    table {
        border-collapse: collapse;
    }
    td, th {
        border: 1px solid;
        padding: 2px 8px 2px 8px;
    }
</style>
<header><script>
const prefix = "text2mindmap";
function build_table() {
    let el = document.getElementById("tbl");
    try {
        let t = "";

        let setting = JSON.parse(localStorage.getItem(prefix + "visitedPages"));

        t += "<table><tr><th width=\"700\">Title</th><th>Read-only link</th><th>Read-write link</th></tr>";
        t2 = "";
        for(let p in setting) {
            if(setting.hasOwnProperty(p)) {
                let o = setting[p];
                t2 += "<tr><td>"+o["title"]+"</td>";
                t2 += "<td><a href=\"<?php echo $base?>?k=" + o["rokey"] + "\" target=\"#\">Read-only</a></td>";
                if(o.hasOwnProperty("rwkey")) {
                    t2 += "<td><a href=\"<?php echo $base?>?k=" + o["rwkey"] + "\" target=\"#\">Read-write</a></td>";
                } else {
                    t2 += "<td> &nbsp; </td>";
                }
                t2 += "</tr>";
            }
        }
        if(t2 == "") {
            t2 = "<tr><td colspan=\"3\"> (Visit history is empty) </td></tr>";
        }
        t += t2 + "</table>";

        el.innerHTML = t;
    } catch (exception) {
        // malformed something?
        console.log(exception);
        el.innerHTML = "(Something wrong with reading history)";
    }
}

function clearHistory() {
    localStorage.setItem("text2mindmap" + "visitedPages", "{}");
    build_table();
}
</script>
</header>
<body onload="build_table()">
    <p><a href="javascript:clearHistory()">Clear history</a> &nbsp;
    <a href="javascript:build_table()">Refresh</a></p>
    <div id="tbl"></div>
</body>
