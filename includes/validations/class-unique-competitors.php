<?php
/**
 * Defines the validation for a unique collection of competitors.
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
 * Defines the validation for a unique collection of competitors.
 *
 * @since      1.2.0
 *
 * @package    Simple Tournament Brackets
 * @author     Tournamatch <support@tournamatch.com>
 */
class Unique_Competitors implements Validation {

	/**
	 * Collection of competitors.
	 *
	 * @var string[] $competitors
	 *
	 * @since 1.2.0
	 */
	private $competitors;

	/**
	 * Collection of duplicate competitors.
	 *
	 * @var string[] $repeated
	 *
	 * @since 1.2.0
	 */
	private $repeated;

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
	 * Verifies the collection of competitors is unique
	 *
	 * @since 1.2.0
	 *
	 * @return boolean True on success, false otherwise.
	 */
	public function passes() {
		if ( count( $this->competitors ) !== count( array_flip( $this->competitors ) ) ) {
			$repeated = array_count_values( $this->competitors );
			arsort( $repeated );
			$repeated       = array_filter(
				$repeated,
				function ( $count ) {
					return $count > 1;
				}
			);
			$this->repeated = array_keys( $repeated );
		}

		return true;
	}

	/**
	 * Returns a message explaining why this validation fails.
	 *
	 * @since 1.2.0
	 *
	 * @return string A message explaining why this validation fails.
	 */
	public function failure_message() {
		return sprintf(
			/* translators: A comma separated list of names. */
			_n(
				'Competitors must be unique. The following competitor appears more than once: %s',
				'Competitors must be unique. The following competitors appear more than once: %s',
				count( $this->repeated ),
				'simple-tournament-brackets'
			),
			implode( ', ', $this->repeated )
		);
	}

}
