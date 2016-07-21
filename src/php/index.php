<?php
$buildTime = (int) '<%= htmlWebpackPlugin.options.data.timestamp %>';

$requestURI = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';

//404 on missing parts files
if (preg_match('#\/parts\/.*#' , $requestURI, $matches)) {
    header("HTTP/1.1 404 Not Found");
    header("Cache-Control: max-age=1800, must-revalidate");
    echo file_get_contents(__DIR__.'/../404.html');
    exit;
}

//grab vars in URL
$wouafId = $userId = null;
if (preg_match('#\/wouaf\/([0-9a-f]{24})\/.*#' , $requestURI, $matches)) {
	$wouafId = $matches[1];
}
if (preg_match('#\/user\/([^/]*)\/.*#' , $requestURI, $matches)) {
	$userId = $matches[1];
}
//Generate file Last-modified header
//if no wouaf or user is queried
//=> Last-modified is last build time
//else
//=> Last-modified should be checked from api server

if ($wouafId || $userId) {
	header("Cache-Control: private, max-age=3600");
	header("Last-Modified: ".gmdate("D, d M Y H:i:s", time())." GMT"); //TODO => remove time() and use Last modified data from API
} else {
	header("Cache-Control: max-age=1800, must-revalidate");
	header("Last-Modified: ".gmdate("D, d M Y H:i:s", $buildTime)." GMT");
}
if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) &&
	@strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) == $buildTime) {
	header("HTTP/1.1 304 Not Modified");
	exit;
}

$data = array(
    'content'   => '',
    'canonical' => 'https://'.$_SERVER['HTTP_HOST'].'/',
    'head'      => '',
);
if (!$requestURI || $requestURI === '/') {
    return $data;
}
if (strpos($requestURI, '/about/') !== false) {
    $data['content'] .= file_get_contents(__DIR__.'/../parts/about.html');
}

define('API_KEY', '<%= htmlWebpackPlugin.options.data.apiKey %>');
if ($wouafId || $userId) {
    $data['content'] .= '<script>window.wouafit = {};</script>';
}
if ($wouafId) {
    try {
        //Get wouaf data from API
        $wouafData = curlGet(
            'https://<%= htmlWebpackPlugin.options.data.apiDomain %>/wouafs/'.$wouafId,
            null,
            array(
                CURLOPT_HTTPHEADER => array('Authorization: WouafIt version="1", key="'.API_KEY.'"')
            )
        );
        if ($wouafData) {
            $wouafData = json_decode($wouafData, true);
            if ($wouafData['code'] === 200) {
                $data['canonical'] = 'https://'.$_SERVER['HTTP_HOST'].'/wouaf/'.$wouafId.'/';
                $data['content'] .= '<script>window.wouafit.wouaf = '.json_encode($wouafData['wouaf']).';</script>';
                $data['head'] = getWouafOpenGraph($wouafData['wouaf'])."\n".
								'<link rel="alternate" hreflang="fr" href="https://fr-fr.<%= htmlWebpackPlugin.options.data.domain %>/wouaf/'.$wouafId.'/" />'."\n".
								'<link rel="alternate" hreflang="en" href="https://en-us.<%= htmlWebpackPlugin.options.data.domain %>/wouaf/'.$wouafId.'/" />';
            } elseif ($wouafData['code'] === 404) {
                header("HTTP/1.1 404 Not Found");
                $data['content'] .= '<h1>404 not Found</h1>';
            }
        }
    } catch (Exception $e) {}
} else if ($userId) {
    try {
        //Get user data from API
        $userData = curlGet(
            'https://<%= htmlWebpackPlugin.options.data.apiDomain %>/users/'.$userId,
            null,
            array(
                CURLOPT_HTTPHEADER 	=> array('Authorization: WouafIt version="1", key="'.API_KEY.'"')
            )
        );
        if ($userData) {
            $userData = json_decode($userData, true);
            if ($userData['code'] === 200) {
                $data['canonical'] = 'https://'.$_SERVER['HTTP_HOST'].'/user/'.$userId.'/';
                $data['content'] .= '<script>window.wouafit.user = '.json_encode($userData['user']).';</script>';
                $data['head'] = getUserOpenGraph($userData['user'])."\n".
								'<link rel="alternate" hreflang="fr" href="https://fr-fr.<%= htmlWebpackPlugin.options.data.domain %>/user/'.$userId.'/" />'."\n".
								'<link rel="alternate" hreflang="en" href="https://en-us.<%= htmlWebpackPlugin.options.data.domain %>/user/'.$userId.'/" />';
			} elseif ($wouafData['code'] === 404) {
                header("HTTP/1.1 404 Not Found");
                $data['content'] .= '<h1>404 not Found</h1>';
            }
        }
    } catch (Exception $e) {}
}

return $data;

/**
 * Generate OpenGraph meta tags for a given Wouaf
 * @param array $data wouaf data
 * @return string
 */
function getWouafOpenGraph ($data) {

    if (!empty($data['title'])) {
        $title = $data['title'];
    } else {
        $title = strip_tags($data['text']);
        $title = mb_substr($title, 0, 79). (mb_strlen($title) > 79 ? '…' : '');
    }
    $description = strip_tags($data['text']);
    $description = mb_substr($description, 0, 299).(mb_strlen($description) > 299 ? '…' : '');
    $locale = substr($_SERVER['HTTP_HOST'], 0, 5) === 'fr-fr' ? 'fr_FR' : 'en_US';

    $return = '<meta property="og:title" content="'.htmlspecialchars($title).'" />'."\n".
    '<meta property="og:type" content="article" />'."\n".

    '<meta property="og:article:published_time" content="'.date('c', intval($data['date'][0] / 1000)).'" />'."\n".
    '<meta property="og:article:expiration_time" content="'.date('c', intval($data['date'][1] / 1000)).'" />'."\n".
    '<meta property="og:article:author" content="https://<%= htmlWebpackPlugin.options.data.domain %>/user/'.htmlspecialchars($data['author'][1]).'/" />'."\n".

    '<meta property="og:url" content="https://<%= htmlWebpackPlugin.options.data.domain %>/wouaf/'.$data['id'].'/" />'."\n".
    '<meta property="og:site_name" content="Wouaf IT" />'."\n".
    '<meta property="og:locale" content="'.$locale.'" />'."\n".
    '<meta property="og:description" content="'.htmlspecialchars($description).'" />'."\n";

    if (!empty($data['pics']) && is_array($data['pics'])) {
        foreach ($data['pics'] as $pic) {
            $return .= '<meta property="og:image" content="'.htmlspecialchars($pic).'" />'."\n";
        }
    } else {
        $return .= '<meta property="og:image" content="https://<%= htmlWebpackPlugin.options.data.imgDomain %>/icon.png" />'."\n";
    }

    return $return;
}

/**
 * Generate OpenGraph meta tags for a given User
 * @param array $data user data
 * @return string
 */
function getUserOpenGraph ($data) {
    $title = trim(!empty($data['firstname']) && !empty($data['lastname']) ? $data['firstname'] .' '. $data['lastname'] : $data['username']);
    $return = '<meta property="og:title" content="'.htmlspecialchars($title).'" />'."\n".
              '<meta property="og:type" content="profile" />'."\n".
              '<meta property="og:url" content="https://<%= htmlWebpackPlugin.options.data.domain %>/user/'.$data['username'].'/" />'."\n".
              '<meta property="og:site_name" content="Wouaf IT" />'."\n".
              '<meta property="og:locale" content="'.$data['lang'].'" />'."\n".
              '<meta property="og:image" content="https://<%= htmlWebpackPlugin.options.data.imgDomain %>/icon.png" />'."\n";
    if (!empty($data['description'])) {
        $return .= '<meta property="og:description" content="'.htmlspecialchars(mb_substr(strip_tags($data['description']), 0, 300)).'" />'."\n";
    }
    if (!empty($data['gender'])) {
        $return .= '<meta property="og:profile:gender" content="'.htmlspecialchars($data['gender']).'" />'."\n";
    }
    if (!empty($data['lastname'])) {
        $return .= '<meta property="og:profile:last_name" content="'.htmlspecialchars($data['lastname']).'" />'."\n";
    }
    if (!empty($data['firstname'])) {
        $return .= '<meta property="og:profile:first_name" content="'.htmlspecialchars($data['firstname']).'" />'."\n";
    }
    return $return;
}

/**
 * Send a GET request using cURL
 * @param string $url to request
 * @param array $get values to send
 * @param array $options for cURL
 * @return string
 * @throws Exception
 */
function curlGet($url, array $get = null, array $options = array()) {
	$defaults = array(
		CURLOPT_HEADER => 0,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_TIMEOUT => 4,
		CURLOPT_URL => $url,
	);
	if ($get) {
		$defaults[CURLOPT_URL] .= (strpos($url, '?') === false ? '?' : ''). http_build_query($get);
	}

	$ch = curl_init();
	curl_setopt_array($ch, ($options + $defaults));
	if( ! $result = curl_exec($ch))  {
		throw new Exception('CURL error: '.curl_error($ch));
	}
	curl_close($ch);
	return $result;
}