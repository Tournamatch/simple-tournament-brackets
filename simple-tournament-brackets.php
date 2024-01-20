<?php
/**
 * Simple Tournament Brackets
 *
 * @package   Simple Tournament Brackets
 * @author    Tournamatch
 * @copyright 2024 MessyHair, LLC
 * @license   GPL-2.0+
 *
 * @wordpress-plugin
 * Plugin Name: Simple Tournament Brackets
 * Plugin URI: https://www.tournamatch.com/
 * Description: Manage tournaments with a simple easy to use interface on your website.
 * Version: 1.2.0
 * Author: Tournamatch
 * Author URI: https://www.tournamatch.com
 * License: Free
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

if ( ! defined( 'SIMPLE_TOURNAMENT_BRACKETS_VERSION' ) ) {
	define( 'SIMPLE_TOURNAMENT_BRACKETS_VERSION', '1.2.0' );
}

if ( ! defined( '__STBPATH' ) ) {
	define( '__STBPATH', plugin_dir_path( __FILE__ ) );
}

if ( ! defined( 'STB_API_VERSION' ) ) {
	define( 'STB_API_VERSION', '1.0.0' );
}

if ( ! defined( 'STB_API' ) ) {
	// define( 'STB_API', 'https://www.simpletournamentbrackets.com/api' );
	define( 'STB_API', 'http://api.simpletournamentbrackets.local' );
}

if ( ! defined( 'STB_EXTENSIONS_ENABLED' ) ) {
	define( 'STB_EXTENSIONS_ENABLED', true );
}

if ( ! function_exists( 'simple_tournament_brackets_include_dependencies' ) ) {
	/**
	 * Include necessary dependencies.
	 *
	 * @since 1.0.0
	 */
	function simple_tournament_brackets_include_dependencies() {
		if ( is_admin() ) {
			require_once __STBPATH . 'includes/classes/class-admin.php';
			require_once __STBPATH . 'includes/validations/class-validation.php';
			require_once __STBPATH . 'includes/validations/class-competitor-count.php';
			require_once __STBPATH . 'includes/validations/class-unique-competitors.php';
		}
		require_once __STBPATH . 'includes/classes/class-shortcodes.php';
	}
}
add_action( 'init', 'simple_tournament_brackets_include_dependencies' );

require_once __STBPATH . 'includes/classes/class-initialize.php';

/*
The functions below here are simple helper functions.
*/
if ( ! function_exists( 'array_insert' ) ) {
	/**
	 * Inserts an associative array item at a given position.
	 *
	 * @since 1.0.0
	 *
	 * @param array   $array Original array to modify.
	 * @param integer $index Where to insert the new array item.
	 * @param array   $insert New array item to insert at the given position.
	 *
	 * @return array Returns array with associated item insert in the correct position.
	 */
	function array_insert( $array, $index, $insert ) {
		return array_slice( $array, 0, $index, true ) +
			$insert +
			array_slice( $array, $index, count( $array ) - $index, true );
	}
}

if ( ! function_exists( 'array_keys_exist' ) ) {
	/**
	 * Verifies the keys exist in the given array.
	 *
	 * @since 1.0.0
	 *
	 * @param string[] $keys Array of keys to verify.
	 * @param array    $array Array to search.
	 *
	 * @return bool True if all keys exist, false otherwise.
	 */
	function array_keys_exist( $keys, $array ) {
		return count( array_intersect_key( array_flip( $keys ), $array ) ) === count( $keys );
	}
}

if ( ! function_exists( 'stb_api_address' ) ) {
	/**
	 * Returns the API url for a given path.
	 *
	 * @since 1.2.0
	 *
	 * @param string $path The path to return.
	 * @param string $version A specific version of the API. Defaults to latest.
	 *
	 * @return string
	 */
	function stb_api_address( $path = '', $version = '' ) {
		if ( 0 === strlen( $version ) ) {
			$version = STB_API_VERSION;
		}

		return STB_API . '/' . $version . '/' . $path;
	}
}

if ( ! function_exists( 'stb_get_default_options' ) ) {
	/**
	 * Returns the default options for Simple Tournament Brackets.
	 *
	 * @since 1.2.0
	 *
	 * @return array Array of options.
	 */
	function stb_get_default_options() {
		return apply_filters(
			'stb_default_options',
			array(
				'version' => SIMPLE_TOURNAMENT_BRACKETS_VERSION,
			)
		);
	}
}

if ( ! function_exists( 'stb_get_options' ) ) {
	/**
	 * Retrieves an array of Simple Tournament Brackets options.
	 *
	 * @since 1.2.0
	 *
	 * @return array An array of options.
	 */
	function stb_get_options() {
		$options        = stb_get_default_options();
		$stored_options = get_option( 'stb_options' );
		if ( is_array( $stored_options ) ) {
			$options = array_merge( $options, $stored_options );
		}

		return $options;
	}
}

if ( ! function_exists( 'stb_get_option' ) ) {
	/**
	 * Retrieves a Simple Tournament Brackets option value by option name.
	 *
	 * @since 1.2.0
	 *
	 * @param string $option The option name.
	 * @param mixed  $default The default value to return.
	 *
	 * @return mixed The option value.
	 */
	function stb_get_option( $option, $default = false ) {
		$options = stb_get_options();

		return isset( $options[ $option ] ) ? $options[ $option ] : $default;
	}
}

if ( ! function_exists( 'stb_verify_plugin_dependencies' ) ) {
	/**
	 * Verifies a plugin meets the necessary dependencies to activate.
	 *
	 * @since 1.2.0
	 *
	 * @param string $plugin Name of the plugin that is activating.
	 * @param array  $dependencies Array of dependencies to verify.
	 */
	function stb_verify_plugin_dependencies( $plugin, $dependencies ) {
		$errors = array();

		foreach ( $dependencies as $dependency => $minimum_version ) {
			$path = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $dependency;
			if ( file_exists( $path ) ) {
				$data   = get_plugin_data( $path );
				$failed = ! version_compare( $data['Version'], $minimum_version, '>=' );
				if ( $failed ) {
					/* translators: Plugin Name, a semantic version, another plugin name. Another plugin name and the actual version. */
					$errors[] = sprintf( esc_html__( 'Plugin "%1$s" requires a minimum version "%2$s" of "%3$s". "%4$s" is version "%5$s" and the minimum was not met.', 'simple-tournament-brackets' ), $plugin, $minimum_version, $data['Name'], $data['Name'], $data['Version'] );
				}
			}
		};

		if ( 0 < count( $errors ) ) {
			echo '<h3>' . esc_html__( 'Please update all Simple Tournament Brackets plugins before activating.', 'simple-tournament-brackets' ) . ' ' . esc_html__( 'The minimum version was not met for one or more plugins.', 'simple-tournament-brackets' ) . '</h3>';
			echo '<p>';
			array_walk(
				$errors,
				function ( $error ) {
					echo esc_html( $error ) . '<br>';
				}
			);
			echo '</p>';

			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error, WordPress.PHP.NoSilencedErrors.Discouraged
			@trigger_error( esc_html__( 'Please update all Simple Tournament Brackets plugins before activating.', 'simple-tournament-brackets' ), E_USER_ERROR );
		}
	}
}

if ( ! function_exists( 'stb_get_api_headers' ) ) {
	/**
	 * Defines headers needed for STB REST API calls.
	 *
	 * @since 1.2.0
	 *
	 * @param string $license_key An optional license key to send.
	 *
	 * @return array
	 */
	function stb_get_api_headers( $license_key = '' ) {
		$license_key = strlen( $license_key ) > 0 ? $license_key : stb_get_option( 'license_key', '' );
		$http_host   = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';

		$headers = array(
			'Content-Type'    => 'application/json; charset=utf-8',
			'Accept'          => 'application/json; charset=utf-8',
			'Api-Version'     => STB_API_VERSION,
			'Api-License-Key' => $license_key,
			'Api-Host'        => $http_host,
		);

		return $headers;
	}
}

if ( ! function_exists( 'stb_total_rounds' ) ) {
	/**
	 * Returns the total number of rounds for the given tournament size.
	 *
	 * @since 1.2.0
	 *
	 * @param $total_competitors integer Total number of competitors.
	 *
	 * @return integer Total number of rounds.
	 */
	function stb_total_rounds( $total_competitors ) {
		return intval( ceil( log( $total_competitors, 2 ) ) );
	}
}

if ( ! function_exists( 'stb_calculate_next_spots' ) ) {
	/**
	 * Calculates the array of next match spots for each match.
	 *
	 * @since 1.2.0
	 *
	 * @param $competitor_count integer The number of competitors in the tournament.
	 *
	 * @return integer[]
	 */
	function stb_calculate_next_spots( $competitor_count ) {
		$total_rounds          = stb_total_rounds( $competitor_count );
		$current_round_matches = pow( 2, $total_rounds - 1 );
		$match_count           = 0;
		$next_spots            = array();

		for ( $round = 0; $round < $total_rounds; $round++ ) {

			for ( $spot = 0; $spot < $current_round_matches; $spot++ ) {
				$next_spots[ $spot + $match_count ] = (int) ( $match_count + $current_round_matches + floor( $spot / 2 ) );
			}

			$match_count          += $current_round_matches;
			$current_round_matches = $current_round_matches / 2;
		}

		return $next_spots;
	}
}
