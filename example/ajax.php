<?php

usleep(3e5);

if (isset($_GET['error'])) {
	http_response_code(404);
	echo "Not found";
} elseif (isset($_GET['json'])) {
	header('Content-Type: application/json; charset=UTF-8');
	echo isset($_GET['invalid']) ? '{' : '', json_encode([
		$_SERVER['REQUEST_METHOD'], $_SERVER['QUERY_STRING'],
		time(), date('H:i:s'),
		isset($_GET['q'])  ? $_GET['q']  : NULL,
		isset($_POST['q']) ? $_POST['q'] : NULL,
	], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
} elseif (isset($_GET['headers'])) {
	echo "The 'X-*' request headers received by server:<br />\n";
	foreach (apache_request_headers() as $header => $value)
		if (substr($header, 0, 2) == 'X-')
			echo "<b>$header</b>: $value<br />\n";
} elseif (isset($_GET['cookies'])) {
	echo "The request cookies received by server:<br />\n";
	foreach ($_COOKIE as $name => $value)
		echo "<b>$name</b>: $value<br />\n";
} else {
	echo $_SERVER['REQUEST_METHOD'], ' ', $_SERVER['QUERY_STRING'], "<br />\n",
	date('H:i:s'), "<br />\n",
	'GET[q] : ', isset($_GET['q'])  ? $_GET['q']  : '-', "<br />\n",
	'POST[q]: ', isset($_POST['q']) ? $_POST['q'] : '-';
};

?>