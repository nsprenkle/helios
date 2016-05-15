<?php
$dataLog = "datalog.csv";
// append to file
// file_put_contents($dataLog, urldecode(file_get_contents("php://input")), FILE_APPEND);
// replace file
file_put_contents($dataLog, urldecode(file_get_contents("php://input")));
?>
