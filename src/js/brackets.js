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

    function getCompetitors(tournament_id) {
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
            let tabCount = 0;

            function createElement(element, attribute, inner) {
                if (typeof(element) === "undefined") {
                    return false;
                }
                if (typeof(inner) === "undefined") {
                    inner = "";
                }
                var el = document.createElement(element);
                if (typeof(attribute) === 'object') {
                    for (var key in attribute) {
                        el.setAttribute(key, attribute[key]);
                    }
                }
                if (!Array.isArray(inner)) {
                    inner = [inner];
                }
                for (var k = 0; k < inner.length; k++) {
                    if (inner[k].tagName) {
                        el.appendChild(inner[k]);
                    } else {
                        el.appendChild(document.createTextNode(inner[k]));
                    }
                }
                return el;
            }

            function createModal(id, title) {
                const body = createElement('div', {class: 'simple-tournament-brackets-modal-body'});

                const tabStrip = createElement('ul', {id: 'simple-tournament-brackets-modal-navigation', role: 'tablist', 'aria-label': 'Match Details Tabs'});
                const tabContent = createElement('div', {id: 'simple-tournament-brackets-modal-content'});

                body.appendChild(tabStrip);
                body.appendChild(tabContent);

                const selectTab = function(name) {
                    const tabItem = document.getElementById(`tab-${name}`);

                    if (tabItem) {
                        tabItem.click();
                    }
                };

                const addTab = function(title, content, name) {
                    tabCount++;

                    const tabStrip = document.getElementById(`simple-tournament-brackets-modal-navigation`);
                    const tabContent = document.getElementById(`simple-tournament-brackets-modal-content`);
                    const contentTarget = createElement(
                        'div',
                        {
                            id: `panel-${name}`,
                            role: 'tabpanel',
                            tabindex: 0,
                            'aria-labelledby': `tab-${name}`
                        },
                        content
                    );

                    const tabItem = createElement(
                        'li',
                        {
                            id: `tab-${name}`,
                            role: 'tab',
                            'aria-selected': 'false',
                            'aria-controls': `panel-${name}`,
                            tabindex: -1
                        },
                        title
                    );

                    if (tabStrip && tabContent) {
                        tabStrip.appendChild(tabItem);
                        tabContent.appendChild(contentTarget);

                        tabItem.addEventListener('click', function(event) {
                            [...tabStrip.children, ...tabContent.children].forEach((child) => {
                                child.classList.remove('active');
                            });
                            tabItem.classList.add('active');
                            contentTarget.classList.add('active');
                        });
                    }

                    if (1 < tabCount) {
                        tabStrip.style.display = 'block';
                    } else {
                        tabStrip.style.display = 'none';
                        contentTarget.classList.add('active');
                    }

                    return contentTarget;
                };

                const close = createElement(
                    'span',
                    {
                        class: 'simple-tournament-brackets-modal-close',
                        'aria-label': 'Close',
                        'aria-hidden': true,
                    },
                    '\u00d7'
                );

                const modal = createElement(
                    'div',
                    {
                        id: id,
                        class: 'simple-tournament-brackets-modal',
                        style: 'display: none',
                    },
                    createElement(
                        'div',
                        {
                            class: 'simple-tournament-brackets-modal-dialog',
                        },
                        createElement(
                            'div',
                            {
                                class: 'simple-tournament-brackets-modal-content',
                            },
                            [
                                close,
                                body
                            ]
                        )
                    )
                );

                modal['addTab'] = addTab.bind(modal);
                modal['selectTab'] = selectTab.bind(modal);

                window.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        modal.style.display = "none";
                    }
                });

                close.addEventListener('click', () => {
                    modal.style.display = "none";
                });

                return {modal, body, addTab}
            }

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
                    content += `<div class="dropdown-content" data-match-id="${match_id}">`;
                    if (tournament.matches[match_id] && tournament.matches[match_id].one_id !== null) {
                        const one_id = tournament.matches[match_id].one_id;
                        const one_name = tournament.competitors[one_id].name;
                        content += `<a href="#" class="advance-competitor" data-tournament-id="${tournament_id}" data-match-id="${match_id}" data-competitor-id="${one_id}" data-competitor-name="${one_name}">${options.language.advance.replace('{NAME}', one_name)}</a>`;
                    }
                    if (tournament.matches[match_id] && tournament.matches[match_id].two_id !== null) {
                        const two_id = tournament.matches[match_id].two_id;
                        const two_name = tournament.competitors[two_id].name;
                        content += `<a href="#" class="advance-competitor" data-tournament-id="${tournament_id}" data-match-id="${match_id}" data-competitor-id="${two_id}" data-competitor-name="${two_name}">${options.language.advance.replace('{NAME}', two_name)}</a>`;
                    }
                    if (!is_first_round) {
                        content += `<a href="#" class="clear-competitors" data-tournament-id="${tournament_id}" data-match-id="${match_id}">${options.language.clear}</a>`;

                    }
                    content += `</div>`;
                    content += `</div>`;
                }

                return content;
            }

            function intoMatchClass(tournament, match_id, round, byes) {
                if (1 === round) return `no-match`;

                if (2 === round) {
                    let firstRoundMatches = Math.pow(2, tournament.rounds - 1);
                    console.log(`first round matches is: ${firstRoundMatches}`);
                    let currentRoundSpot = match_id - firstRoundMatches;
                    console.log(`match_id: ${match_id}; spot: ${currentRoundSpot}`);
                    let previousRoundUpMatchId = (currentRoundSpot * 2);
                    let previousRoundBottomMatchId = (currentRoundSpot * 2) + 1;
                    console.log(`up: ${previousRoundUpMatchId}; bottom: ${previousRoundBottomMatchId}`);
                    console.log(byes);
                    if (byes[previousRoundUpMatchId] && byes[previousRoundBottomMatchId]) {
                        return `no-match`;
                    } else if (byes[previousRoundUpMatchId]) {
                        return `upper-bye`;
                    } else if (byes[previousRoundBottomMatchId]) {
                        return `lower-bye`;
                    }
                }

                return `no-bye`;
            }

            function renderMatch(tournament, tournament_id, match_id, round, can_edit_matches, byes) {
                let content = ``;
                content += `<div class="simple-tournament-brackets-match">`;

                if (byes[match_id]) {
                    content += `<div><div>&nbsp;</div><div>&nbsp;</div></div>`;
                } else {
                    if (1 !== round) {
                        content += `<div class="horizontal-line ${intoMatchClass(tournament, match_id, round, byes)}"></div>`;
                    }
                    content += `<div class="simple-tournament-brackets-match-body" data-match-id="${match_id}">`;

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

                    if (round !== tournament.rounds) {
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
                }
                content += `</div>`;

                return content;
            }

            function filterRounds(origRounds, numberOfRounds) {
                const rounds = [...origRounds];

                if ( 7 >= numberOfRounds ) {
                    rounds[4] = null;
                }
                if ( 6 >= numberOfRounds ) {
                    rounds[3] = null;
                }
                if ( 5 >= numberOfRounds ) {
                    rounds[5] = null;
                }
                if ( 4 >= numberOfRounds ) {
                    rounds[2] = null;
                }
                if ( 3 >= numberOfRounds ) {
                    rounds[6] = null;
                }
                if ( 2 >= numberOfRounds ) {
                    rounds[1] = null;
                }

                return rounds.filter((r) => r !== null);
            }

            function renderBrackets(tournament, container, tournament_id) {
                let content = ``;
                let matchPaddingCount;
                let rounds = filterRounds(options.language.rounds, tournament.rounds);
                let byes = [];

                content += `<div class="simple-tournament-brackets-round-header-container">`;
                for (let i = 0; i <= tournament.rounds; i++) {
                    content += `<span class="simple-tournament-brackets-round-header">${rounds[i]}</span>`;
                }
                content += `</div>`;
                content += renderProgress(calculateProgress(tournament));

                content += `<div class="simple-tournament-brackets-round-body-container">`;
                let spot = 1;
                let sumOfGames = 0;
                let numberOfGames = Math.pow(2, Math.ceil(Math.log2(tournament.competitors.length)));

                for (let round = 1; round <= tournament.rounds; round++) {
                    numberOfGames = numberOfGames / 2;
                    matchPaddingCount = Math.pow(2, round) - 1;

                    content += `<div class="simple-tournament-brackets-round-body">`;

                    for (spot; spot <= (numberOfGames + sumOfGames); spot++) {
                        byes[spot - 1] = tournament.matches[spot - 1] && (tournament.matches[spot - 1].status === 'tournament_bye');

                        for (let padding = 0; padding < matchPaddingCount; padding++) {
                            if (1 === spot % 2) {
                                content += `<div class="match-half">&nbsp;</div> `;
                            } else {
                                content += `<div class="vertical-line${byes[spot - 1] ? ' no-image' : ''}">&nbsp;</div> `;
                            }
                        }
                        content += renderMatch(tournament, tournament_id, spot - 1, round, options.can_edit_matches, byes);
                        for (let padding = 0; padding < matchPaddingCount; padding++) {
                            if ((round !== tournament.rounds) && (1 === spot % 2)) {
                                console.log(`spot is ${spot}`);
                                content += `<div class="vertical-line${byes[spot - 1] ? ' no-image' : ''}">&nbsp;</div> `;
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


            let newModal = createModal('simple-tournament-brackets-report-scores-modal', 'Match Details');
            document.body.appendChild(newModal.modal);

            Array.from(document.getElementsByClassName('simple-tournament-brackets'))
                .forEach(
                    (item) => {
                        getCompetitors(item.dataset.tournamentId)
                            .then((response) => {
                                renderBrackets(response.stb_match_data, item, item.dataset.tournamentId);

                                Array.from(document.querySelectorAll(`#simple-tournament-brackets-${item.dataset.tournamentId} .dropdown-content`))////*[@id="simple-tournament-brackets-152"]/div[3]/div[1]/div[5]/div[3]/div
                                    .forEach(
                                        (item) => {
                                            console.log(item);
                                            item.addEventListener('click', () => {
                                                item.classList.add('hide');
                                            });

                                            item.addEventListener('mouseleave', () => {
                                                item.classList.remove('hide');
                                            });
                                        }
                                    );

                                const doneEvent = new CustomEvent("brackets.done", {
                                    bubbles: true,
                                    detail: {
                                        tournamentId: item.dataset.tournamentId,
                                        tournamentData: response,
                                    }
                                });

                                item.dispatchEvent(doneEvent);
                            });
                    }
                );
        },
        false
    );
})();
