/**
 * Handles rendering the content for tournament brackets.
 *
 * @link       https://www.tournamatch.com
 * @since      1.0.0
 *
 * @package    Simple Tournament Brackets
 *
 */
(function () {
    'use strict';

    const options = simple_tournament_brackets_options;

    function get_competitors(tournament_id) {
        return fetch(`${options.site_url}/wp-json/wp/v2/stb-tournament/${tournament_id}`, {
            headers: {"Content-Type": "application/json; charset=utf-8"},
        })
            .then(response => response.json());
    }

    function clear(tournament_id, match_id) {
        return fetch(`${options.site_url}/wp-json/simple-tournament-brackets/v1/tournament-matches/clear`, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "X-WP-Nonce": options.rest_nonce,
            },
            method: 'POST',
            body: JSON.stringify({
                id: match_id,
                tournament_id: tournament_id,
            })
        })
            .then(response => response.json());
    }

    function advance(tournament_id, match_id, winner_id) {
        return fetch(`${options.site_url}/wp-json/simple-tournament-brackets/v1/tournament-matches/advance`, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "X-WP-Nonce": options.rest_nonce,
            },
            method: 'POST',
            body: JSON.stringify({
                id: match_id,
                tournament_id: tournament_id,
                winner_id: winner_id,
            })
        })
            .then(response => response.json());
    }

    window.addEventListener(
        'load',
        function () {

            function competitorMouseOver(event) {
                const className = `competitor-${event.target.dataset.competitorId}`;
                Array.from(document.getElementsByClassName(className))
                    .forEach(
                        item => {
                            item.classList.add('simple-tournament-brackets-competitor-highlight');
                        }
                    );
            }

            function competitorMouseLeave(event) {
                const className = `competitor-${event.target.dataset.competitorId}`;
                Array.from(document.getElementsByClassName(className))
                    .forEach(
                        item => {
                            item.classList.remove('simple-tournament-brackets-competitor-highlight');
                        }
                    );
            }

            function calculateProgress(tournament) {
                const totalGames = tournament.competitors.length - 1;
                let finishedGames = 0;

                for (let i = (tournament.competitors.length / 2); i <= tournament.competitors.length; i++) {
                    if (tournament.matches[i]) {
                        if (tournament.matches[i].one_id !== null) finishedGames++;
                        if (tournament.matches[i].two_id !== null) finishedGames++;
                    }
                }
                return (finishedGames / totalGames);
            }

            function renderProgress(float) {
                return `<div class="simple-tournament-brackets-progress" style="width: ${100 * float}%;">&nbsp;</div> `;
            }

            function renderDropDown(tournament, tournament_id, match_id) {
                let content = ``;
                const is_first_round = match_id < (tournament.competitors.length / 2);

                if (tournament.matches[match_id] && ((tournament.matches[match_id].one_id !== null) || (tournament.matches[match_id].two_id !== null))) {
                    content += `<div class="dropdown">`;
                    content += `<span class="more-details dashicons dashicons-admin-generic"></span>`;
                    content += `<div class="dropdown-content" >`;
                    if (tournament.matches[match_id] && tournament.matches[match_id].one_id !== null) {
                        const one_id = tournament.matches[match_id].one_id;
                        content += `<a href="#" class="advance-competitor" data-tournament-id="${tournament_id}" data-match-id="${match_id}" data-competitor-id="${one_id}">${options.language.advance.replace('{NAME}', tournament.competitors[one_id].name)}</a>`;
                    }
                    if (tournament.matches[match_id] && tournament.matches[match_id].two_id !== null) {
                        const two_id = tournament.matches[match_id].two_id;
                        content += `<a href="#" class="advance-competitor" data-tournament-id="${tournament_id}" data-match-id="${match_id}" data-competitor-id="${two_id}">${options.language.advance.replace('{NAME}', tournament.competitors[two_id].name)}</a>`;
                    }
                    if ( !is_first_round) {
                        content += `<a href="#" class="clear-competitors" data-tournament-id="${tournament_id}" data-match-id="${match_id}">${options.language.clear}</a>`;

                    }
                    content += `</div>`;
                    content += `</div>`;
                }

                return content;
            }

            function renderMatch(tournament, tournament_id, match_id, flow, can_edit_matches) {
                let content = ``;
                content += `<div class="simple-tournament-brackets-match">`;
                content += `<div class="horizontal-line"></div>`;
                content += `<div class="simple-tournament-brackets-match-body">`;

                if (tournament.matches[match_id] && tournament.matches[match_id].one_id !== null) {
                    const one_id = tournament.matches[match_id].one_id;
                    const one_name = tournament.competitors[one_id] ? tournament.competitors[one_id].name : '&nbsp;';
                    content += `<span class="simple-tournament-brackets-competitor competitor-${one_id}" data-competitor-id="${one_id}">${one_name}</span>`;
                } else {
                    content += `<span class="simple-tournament-brackets-competitor">&nbsp;</span>`;
                }

                if (tournament.matches[match_id] && tournament.matches[match_id].two_id !== null) {
                    const two_id = tournament.matches[match_id] ? tournament.matches[match_id].two_id : null;
                    const two_name = tournament.matches[match_id] ? tournament.competitors[two_id].name : '&nbsp;';
                    content += `<span class="simple-tournament-brackets-competitor competitor-${two_id}" data-competitor-id="${two_id}">${two_name}</span>`;
                } else {
                    content += `<span class="simple-tournament-brackets-competitor">&nbsp;</span>`;
                }

                content += `</div>`;

                if (flow) {
                    if (1 === match_id % 2) {
                        content += `<div class="bottom-half">`;
                    } else {
                        content += `<div class="top-half">`;
                    }

                    if (can_edit_matches) {
                        content += renderDropDown(tournament, tournament_id, match_id);
                    }

                    content += `</div>`;
                }
                content += `</div>`;

                return content;
            }

            function renderBrackets(tournament, container, tournament_id) {
                let content = ``;
                let numberOfGames;
                let matchPaddingCount;

                content += `<div class="simple-tournament-brackets-round-header-container">`;
                for (let i = 0; i <= tournament.rounds; i++) {
                    content += `<span class="simple-tournament-brackets-round-header">${options.language.rounds[i]}</span>`;
                }
                content += `</div>`;
                content += renderProgress(calculateProgress(tournament));

                content += `<div class="simple-tournament-brackets-round-body-container">`;
                let spot = 1;
                let sumOfGames = 0;
                for (let round = 1; round <= tournament.rounds; round++) {
                    numberOfGames = Math.ceil(tournament.competitors.length / (Math.pow(2, round)));
                    matchPaddingCount = Math.pow(2, round) - 1;

                    content += `<div class="simple-tournament-brackets-round-body">`;

                    for (spot; spot <= (numberOfGames + sumOfGames); spot++) {
                        for (let padding = 0; padding < matchPaddingCount; padding++) {
                            if (1 === spot % 2) {
                                content += `<div class="match-half">&nbsp;</div> `;
                            } else {
                                content += `<div class="vertical-line">&nbsp;</div> `;
                            }
                        }
                        content += renderMatch(tournament, tournament_id, spot - 1, round !== tournament.rounds, options.can_edit_matches);
                        for (let padding = 0; padding < matchPaddingCount; padding++) {
                            if ((round !== tournament.rounds) && (1 === spot % 2)) {
                                content += `<div class="vertical-line">&nbsp;</div> `;
                            } else {
                                content += `<div class="match-half">&nbsp;</div> `;
                            }
                        }
                    }
                    content += `</div>`;
                    sumOfGames += numberOfGames;
                }

                // Display the last winner's spot.
                content += `<div class="simple-tournament-brackets-round-body">`;
                for (let padding = 0; padding < matchPaddingCount; padding++) {
                    content += `<div class="match-half">&nbsp;</div> `;
                }
                content += `<div class="simple-tournament-brackets-match">`;
                content += `<div class="winners-line">`;
                if (options.can_edit_matches) {
                    content += renderDropDown(tournament, tournament_id, spot - 2);
                }
                content += `</div>`;
                content += `<div class="simple-tournament-brackets-match-body">`;
                content += `<span class="simple-tournament-brackets-competitor"><strong>${options.language.winner}</strong></span>`;
                if (tournament.matches[spot - 1] && tournament.matches[spot - 1].one_id !== null) {
                    const winner_id = tournament.matches[spot - 1].one_id;
                    content += `<span class="simple-tournament-brackets-competitor competitor-${winner_id}" data-competitor-id="${winner_id}">${tournament.competitors[winner_id].name}</span>`;
                } else {
                    content += `<span class="simple-tournament-brackets-competitor">&nbsp;</span>`;
                }
                content += `</div>`;
                content += `</div>`;
                for (let padding = 0; padding < matchPaddingCount; padding++) {
                    content += `<div class="match-half">&nbsp;</div> `;
                }
                content += `</div>`;
                // End of display last winner's spot.

                content += `</div>`;

                container.innerHTML = content;

                Array.from(document.getElementsByClassName('simple-tournament-brackets-competitor'))
                    .forEach(
                        (item) => {
                            item.addEventListener('mouseover', competitorMouseOver);
                            item.addEventListener('mouseleave', competitorMouseLeave);
                        }
                    );

                Array.from(document.getElementsByClassName('advance-competitor'))
                    .forEach(
                        (item) => {
                            item.addEventListener('click', (e) => {
                                e.preventDefault();
                                advance(e.target.dataset.tournamentId, e.target.dataset.matchId, e.target.dataset.competitorId)
                                    .then(() => {
                                        location.reload();
                                    });
                            });
                        }
                    );

                Array.from(document.getElementsByClassName('clear-competitors'))
                    .forEach(
                        (item) => {
                            item.addEventListener('click', (e) => {
                                e.preventDefault();
                                clear(e.target.dataset.tournamentId, e.target.dataset.matchId)
                                    .then(() => {
                                        location.reload();
                                    });
                            });
                        }
                    );
            }

            Array.from(document.getElementsByClassName('simple-tournament-brackets'))
                .forEach(
                    (item) => {
                        get_competitors(item.dataset.tournamentId)
                            .then((response) => {
                                renderBrackets(response.stb_match_data, item, item.dataset.tournamentId);
                            });
                    }
                );

        },
        false
    );
})();
