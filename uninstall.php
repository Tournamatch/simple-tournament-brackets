<?php
/**
 * Plugin uninstall script.
 *
 * @link       https://www.tournamatch.com
 * @since      1.0.0
 *
 * @package    Simple Tournament Brackets
 */

// Exit if uninstall not called from WordPress.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit();
}

// :'( Good-bye.
delete_option( 'simple_tournament_brackets_options' );
