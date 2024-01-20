<?php
/**
 * Defines the abstract implementation of a validation.
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
 * Defines the abstract implementation of a validation.
 *
 * @since      1.2.0
 *
 * @package    Simple Tournament Brackets
 * @author     Tournamatch <support@tournamatch.com>
 */
interface Validation {

	/**
	 * Evaluates the requirements for this validation
	 *
	 * @since 1.2.0
	 *
	 * @return boolean True if the requirements for this validation pass, false otherwise.
	 */
	public function passes();

	/**
	 * Returns a message explaining why this validation fails.
	 *
	 * @since 1.2.0
	 *
	 * @return string A message explaining why this validation fails.
	 */
	public function failure_message();
}
