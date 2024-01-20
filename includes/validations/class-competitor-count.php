<?php
/**
 * Defines the validation for the total number of competitors.
 *
 * @link       https://www.tournamatch.com
 * @since      1.2.0
 *
 * @package    Simple Tournament Brackets
 */
namespace SimpleTournamentBrackets\Validations;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Defines the validation for the total number of competitors.
 *
 * @since      1.2.0
 *
 * @package    Simple Tournament Brackets
 * @author     Tournamatch <support@tournamatch.com>
 */
class Competitor_Count implements Validation {

	/**
	 * Collection of competitors.
	 *
	 * @var string[] $competitors
	 *
	 * @since 1.2.0
	 */
	private $competitors;

	/**
	 * Initializes this validation.
	 *
	 * @param string[] $competitors competitors to check.
	 *
	 * @since 1.2
	 */
	public function __construct( $competitors ) {
		$this->competitors = $competitors;
	}

	/**
	 * Verifies the total number of competitors is a power of 2, greater than or equal to 4, less than or equal to 256.
	 *
	 * @since 1.2.0
	 *
	 * @return boolean True on success, false otherwise.
	 */
	public function passes() {
		return in_array( count( $this->competitors ), array( 4, 8, 16, 32, 64, 128, 256 ), true );
	}

	/**
	 * Returns a message explaining why this validation fails.
	 *
	 * @since 1.2.0
	 *
	 * @return string A message explaining why this validation fails.
	 */
	public function failure_message() {
		return __( 'The total number of competitors must be a power of 2 greater than or equal to 4 (4, 8, 16, 32, 64, 128, 256).', 'simple-tournament-brackets' );
	}

}
