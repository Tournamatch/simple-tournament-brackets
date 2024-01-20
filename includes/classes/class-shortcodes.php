<?php
/**
 * Defines available shortcodes.
 *
 * @link       https://www.tournamatch.com
 * @since      1.0.0
 *
 * @package    Simple Tournament Brackets
 */

namespace SimpleTournamentBrackets;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'Shortcodes' ) ) {
	/**
	 * Defines shortcodes.
	 *
	 * @since      1.0.0
	 *
	 * @package    Simple Tournament Brackets
	 * @author     Tournamatch <support@tournamatch.com>
	 */
	class Shortcodes {

		/**
		 * Sets up our handler to register our endpoints.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			$shortcodes = array(
				'simple-tournament-brackets'            => 'brackets',
				'simple-tournament-brackets-match-list' => 'match_list',
			);

			foreach ( $shortcodes as $shortcode => $function ) {
				add_shortcode( $shortcode, array( $this, $function ) );
			}
		}

		/**
		 * Shortcode to create the tournament brackets output.
		 *
		 * @since 1.0.0
		 *
		 * @param array  $attributes Shortcode attributes.
		 * @param null   $content Content between the shortcode tags.
		 * @param string $tag Given shortcode tag.
		 *
		 * @return string
		 */
		public function brackets( $attributes = [], $content = null, $tag = '' ) {

			$attributes = array_change_key_case( (array) $attributes, CASE_LOWER );

			if ( ( 'publish' !== get_post_status( $attributes['tournament_id'] ) ) || ( 'stb-tournament' !== get_post_type( $attributes['tournament_id'] ) ) ) {
				return '';
			}

			if ( ! in_array( get_post_meta( $attributes['tournament_id'], 'stb_status', true ), array( 'in_progress', 'finished' ), true ) ) {
				return '<p class="text-center">' . esc_html__( 'The tournament has not started.', 'simple-tournament-brackets' ) . '</p>';
			}

			$round_language = array(
				0 => esc_html__( 'Round 1', 'simple-tournament-brackets' ),
				1 => esc_html__( 'Round 2', 'simple-tournament-brackets' ),
				2 => esc_html__( 'Round 3', 'simple-tournament-brackets' ),
				3 => esc_html__( 'Round 4', 'simple-tournament-brackets' ),
				4 => esc_html__( 'Round 5', 'simple-tournament-brackets' ),
				5 => esc_html__( 'Quarter-Finals', 'simple-tournament-brackets' ),
				6 => esc_html__( 'Semi-Finals', 'simple-tournament-brackets' ),
				7 => esc_html__( 'Finals', 'simple-tournament-brackets' ),
				8 => esc_html__( 'Winner', 'simple-tournament-brackets' ),
			);

			$round_language = array_values( $round_language );

			$options = array(
				'rest_nonce'       => wp_create_nonce( 'wp_rest' ),
				'site_url'         => site_url(),
				'can_edit_matches' => current_user_can( 'manage_options' ),
				'language'         => array(
					'error'   => esc_html__( 'An error occurred.', 'simple-tournament-brackets' ),
					'rounds'  => $round_language,
					'clear'   => esc_html__( 'Clear', 'simple-tournament-brackets' ),
					'advance' => esc_html__( 'Advance {NAME}', 'simple-tournament-brackets' ),
					'winner'  => esc_html__( 'Winner', 'simple-tournament-brackets' ),
				),
			);

			$color_options = get_option( 'simple_tournament_brackets_options' );

			$inline_css  = '.simple-tournament-brackets-round-header {background: ' . sanitize_hex_color( $color_options['round_background_color'] ) . '; color: ' . sanitize_hex_color( $color_options['round_header_color'] ) . ';}';
			$inline_css .= '.simple-tournament-brackets-match-body {background: ' . sanitize_hex_color( $color_options['match_background_color'] ) . '; color: ' . sanitize_hex_color( $color_options['match_color'] ) . ';}';
			$inline_css .= '.simple-tournament-brackets-competitor-highlight {background: ' . sanitize_hex_color( $color_options['match_background_hover_color'] ) . '; color: ' . sanitize_hex_color( $color_options['match_hover_color'] ) . ';}';
			$inline_css .= '.simple-tournament-brackets-progress {background: ' . sanitize_hex_color( $color_options['progress_color'] ) . '; }';

			wp_register_style( 'simple-tournament-brackets-style', plugins_url( '../../css/main.css', __FILE__ ), array(), SIMPLE_TOURNAMENT_BRACKETS_VERSION );
			wp_enqueue_style( 'simple-tournament-brackets-style' );
			wp_add_inline_style( 'simple-tournament-brackets-style', $inline_css );

			wp_register_script( 'simple-tournament-brackets', plugins_url( '../../js/brackets.js', __FILE__ ), array(), SIMPLE_TOURNAMENT_BRACKETS_VERSION, true );
			wp_localize_script( 'simple-tournament-brackets', 'simple_tournament_brackets_options', $options );
			wp_enqueue_script( 'simple-tournament-brackets' );

			do_action( 'stb_brackets_enqueued' );

			$html  = sprintf( '<div id="simple-tournament-brackets-%d" class="simple-tournament-brackets" data-tournament-id="%d">', $attributes['tournament_id'], $attributes['tournament_id'] );
			$html .= '<p class="text-center">' . esc_html__( 'Loading brackets...', 'simple-tournament-brackets' ) . '</p>';
			$html .= '</div>';

			return $html;
		}

		/**
		 * Shortcode to create the tournament match list output.
		 *
		 * @since 1.2.0
		 *
		 * @param array  $attributes Shortcode attributes.
		 * @param null   $content Content between the shortcode tags.
		 * @param string $tag Given shortcode tag.
		 *
		 * @return string
		 */
		public function match_list( $attributes = [], $content = null, $tag = '' ) {

			$attributes = array_change_key_case( (array) $attributes, CASE_LOWER );

			if ( ! isset( $attributes['tournament_id'] ) ) {
				return '';
			}

			if ( ( 'publish' !== get_post_status( $attributes['tournament_id'] ) ) || ( 'stb-tournament' !== get_post_type( $attributes['tournament_id'] ) ) ) {
				return '';
			}

			if ( ! in_array( get_post_meta( $attributes['tournament_id'], 'stb_status', true ), array( 'in_progress', 'finished' ), true ) ) {
				return '<p class="text-center">' . esc_html__( 'The tournament has not started.', 'simple-tournament-brackets' ) . '</p>';
			}

			$match_data  = get_post_meta( $attributes['tournament_id'], 'stb_match_data', true );
			$competitors = $match_data['competitors'];
			$matches     = $match_data['matches'];

			array_walk(
				$matches,
				function( &$match ) {
					$match['round']       = 0;
					$match['match']       = 0;
					$match['competitors'] = '';
				}
			);

			$total_rounds          = stb_total_rounds( count( $competitors ) );
			$current_round_matches = pow( 2, $total_rounds - 1 );
			$total_rounds          = $match_data['rounds'];
			$match_count           = 0;
			$match_id              = 0;

			for ( $round = 0; $round < $total_rounds; $round++ ) {

				for ( $spot = 0; $spot < $current_round_matches; $spot++ ) {
					$next_match_id = (int) ( $match_count + $current_round_matches + floor( $spot / 2 ) );

					$matches[ $match_id ]['round'] = $round + 1;
					$matches[ $match_id ]['match'] = $match_id + 1;

					if ( isset( $matches[ $match_id ] ) ) {
						$match_side = ( $spot & 1 ) ? 'two_id' : 'one_id';

						if ( isset( $matches[ $next_match_id ] ) && isset( $matches[ $next_match_id ][ $match_side ] ) ) {
							if ( ( $matches[ $match_id ]['one_id'] === $matches[ $next_match_id ][ $match_side ] ) && isset( $matches[ $match_id ]['two_id'] ) ) {
								/* translators: Both placeholders are competitor names. */
								$matches[ $match_id ]['competitors'] = sprintf( __( '%1$s defeated %2$s', 'simple-tournament-brackets' ), esc_html( $competitors[ $matches[ $match_id ]['one_id'] ]['name'] ), esc_html( $competitors[ $matches[ $match_id ]['two_id'] ]['name'] ) );
							} elseif ( ( $matches[ $match_id ]['two_id'] === $matches[ $next_match_id ][ $match_side ] ) && isset( $matches[ $match_id ]['one_id'] ) ) {
								/* translators: Both placeholders are competitor names. */
								$matches[ $match_id ]['competitors'] = sprintf( __( '%1$s lost to %2$s', 'simple-tournament-brackets' ), esc_html( $competitors[ $matches[ $match_id ]['one_id'] ]['name'] ), esc_html( $competitors[ $matches[ $match_id ]['two_id'] ]['name'] ) );
							} else {
								/* translators: A competitor name. */
								$matches[ $match_id ]['competitors'] = sprintf( __( '%1$s advanced', 'simple-tournament-brackets' ), esc_html( $competitors[ $matches[ $next_match_id ][ $match_side ] ]['name'] ) );
							}
						} elseif ( isset( $matches[ $match_id ]['one_id'] ) && $matches[ $match_id ]['two_id'] ) {
							/* translators: Both placeholders are competitor names. */
							$matches[ $match_id ]['competitors'] = sprintf( __( '%1$s vs %2$s', 'simple-tournament-brackets' ), esc_html( $competitors[ $matches[ $match_id ]['one_id'] ]['name'] ), esc_html( $competitors[ $matches[ $match_id ]['two_id'] ]['name'] ) );
						} elseif ( isset( $matches[ $match_id ]['one_id'] ) ) {
							/* translators: A competitor name. */
							$matches[ $match_id ]['competitors'] = sprintf( __( '%1$s opponent not yet decided', 'simple-tournament-brackets' ), esc_html( $competitors[ $matches[ $match_id ]['one_id'] ]['name'] ) );
						} elseif ( isset( $matches[ $match_id ]['two_id'] ) ) {
							/* translators: A competitor name. */
							$matches[ $match_id ]['competitors'] = sprintf( __( '%1$s opponent not yet decided', 'simple-tournament-brackets' ), esc_html( $competitors[ $matches[ $match_id ]['two_id'] ]['name'] ) );
						} else {
							$matches[ $match_id ]['competitors'] = __( 'Match competitors not yet decided', 'simple-tournament-brackets' );
						}
					} else {
						$matches[ $match_id ]['competitors'] = __( 'Match competitors not yet decided', 'simple-tournament-brackets' );
					}

					$match_id++;
				}

				$match_count          += $current_round_matches;
				$current_round_matches = $current_round_matches / 2;
			}

			$total_matches = pow( 2, $total_rounds ) - 1;
			if ( isset( $matches[ $total_matches ] ) ) {
				unset( $matches[ $total_matches ] );
			}

			uasort(
				$matches,
				function ( $left, $right ) {
					if ( $left['match'] < $right['match'] ) {
						return -1;
					} elseif ( $left['match'] > $right['match'] ) {
						return 1;
					} else {
						return 0;
					}
				}
			);

			wp_register_style( 'simple-tournament-brackets-match-list-style', plugins_url( '../../css/main.css', __FILE__ ), array(), SIMPLE_TOURNAMENT_BRACKETS_VERSION );
			wp_enqueue_style( 'simple-tournament-brackets-match-list-style' );

			$table_headings = array(
				'round'       => __( 'Round', 'simple-tournament-brackets' ),
				'match'       => __( 'Match', 'simple-tournament-brackets' ),
				'competitors' => __( 'Competitors', 'simple-tournament-brackets' ),
			);

			/**
			 * Filters the collection of match list table headings.
			 *
			 * @since 1.2
			 *
			 * @param array $table_headings An associative array of table headings. The array key indicates the match
			 * field to render in the table body, and the array value is the text displayed in the table heading.
			 * @param array $attributes Array of attributes given in this shortcode.
			 */
			$table_headings = apply_filters( 'simple_tournament_brackets_match_list_table_headings', $table_headings, $attributes );

			if ( is_null( $table_headings ) || 0 === count( $table_headings ) ) {
				return '';
			}

			$html  = sprintf( '<table id="simple-tournament-brackets-match-list-%d" class="simple-tournament-brackets-match-list" data-tournament-id="%d">', $attributes['tournament_id'], $attributes['tournament_id'] );
			$html .= '<tr class="simple-tournament-brackets-match-list-table-header">';

			foreach ( $table_headings as $id => $title ) {
				$html .= '<th class="simple-tournament-brackets-match-list-table-header-' . esc_html( $id ) . '">' . esc_html( $title ) . '</th>';
			}

			$html .= '</tr>';
			$html .= '<tbody class="simple-tournament-brackets-match-list-table-body">';

			foreach ( $matches as $match ) {
				$html .= '<tr class="simple-tournament-brackets-match-list-table-row">';
				foreach ( array_keys( $table_headings ) as $field ) {
					$html .= '<td class="simple-tournament-brackets-match-list-table-row-' . esc_html( $field ) . '">';
					if ( isset( $match[ $field ] ) ) {

						/**
						 * Filters the content of the cell displayed in the match list table.
						 *
						 * @since 1.2
						 *
						 * @param string $content Content to render.
						 */
						$content = apply_filters( 'simple_tournament_brackets_match_list_table_row_' . $field, $match[ $field ] );

						$html .= wp_kses_post( $content );
					}
					$html .= '</td>';
				}
				$html .= '</tr>';
			}

			$html .= '</tbody>';
			$html .= '</table>';

			return $html;
		}
	}
}

new Shortcodes();
