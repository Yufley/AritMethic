// Oyun durumu
class GameState {
    constructor() {
        this.players = [
            { name: "Sen", points: 0, active: true, isHuman: true },
            { name: "Hamza Eymen", points: 0, active: true, isHuman: false, profile: this.getRandomProfile() },
            { name: "Chisiya", points: 0, active: true, isHuman: false, profile: this.getRandomProfile() },
            { name: "Ebu Cehil", points: 0, active: true, isHuman: false, profile: this.getRandomProfile() },
            { name: "Gus Fring", points: 0, active: true, isHuman: false, profile: this.getRandomProfile() }
        ];
        this.currentTurn = 1;
        this.gameTimer = null;
        this.nextRoundTimer = null;
        this.humanProfile = null;
        this.linkedPlayer = null;
        this.currentGuesses = [];
        this.eliminatedCount = 0;
        this.isProphecyTurn = false;
        this.prophecyTimer = null;
        this.swapperTargets = {}; // Değiştirici oyuncuların hedeflerini sakla
    }

    getRandomProfile() {
        return Math.floor(Math.random() * 10);
    }

    getActivePlayers() {
        return this.players.filter(p => p.active);
    }

    getActivePlayerCount() {
        return this.players.filter(p => p.active).length;
    }
}

// Profil tanımları
const PROFILES = {
    0: { name: "Bağlantılı", desc: "Bir oyuncuya bağlı olursun" },
    1: { name: "Kusursuz", desc: "Tam bilirsen güçlü etki" },
    2: { name: "Aşırıcı", desc: "99 girersen şanslısın" },
    3: { name: "Esnekçi", desc: "Orta aralık avantajı" },
    4: { name: "Gölge", desc: "Bazen görünmezsin" },
    5: { name: "Yaşam", desc: "Elenmeden kurtulursun" },
    6: { name: "Kaosçu", desc: "Kaçırdığında herkes acı çeker" },
    7: { name: "Değiştirici", desc: "Sayıları değiştirebilirsin" },
    8: { name: "Kehanetçi", desc: "Bazen hedefi önceden görürsün" },
    9: { name: "Dönüşümcü", desc: "Belirli turlarda özel güçlerin var" }
};

// Oyun instance'ı
let game = new GameState();

// DOM elementleri
const elements = {
    profileSelection: document.getElementById('profile-selection'),
    playerSelection: document.getElementById('player-selection'),
    inputSection: document.getElementById('input-section'),
    resultSection: document.getElementById('result-section'),
    gameEndSection: document.getElementById('game-end-section'),
    guessInput: document.getElementById('guess-input'),
    readyBtn: document.getElementById('ready-btn'),
    countdown: document.getElementById('countdown'),
    targetNumber: document.getElementById('target-number'),
    allGuesses: document.getElementById('all-guesses'),
    roundWinner: document.getElementById('round-winner'),
    nextRoundCountdown: document.getElementById('next-round-countdown'),
    currentTurn: document.getElementById('current-turn'),
    remainingPlayers: document.getElementById('remaining-players'),
    eliminationAnnouncement: document.getElementById('elimination-announcement'),
    eliminationText: document.getElementById('elimination-text'),
    specialRuleAnnouncement: document.getElementById('special-rule-announcement'),
    specialRuleText: document.getElementById('special-rule-text'),
    gameWinner: document.getElementById('game-winner'),
    restartBtn: document.getElementById('restart-btn'),
    prophecyInfo: document.getElementById('prophecy-info'),
    prophecyTarget: document.getElementById('prophecy-target'),
    prophecyCountdown: document.getElementById('prophecy-countdown')
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
});

function setupEventListeners() {
    // Profil seçimi
    document.querySelectorAll('.profile-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const profileId = parseInt(btn.dataset.profile);
            selectProfile(profileId);
        });
    });

    // Oyuncu seçimi (Bağlantılı profil için)
    document.querySelectorAll('.select-player-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const playerId = parseInt(btn.dataset.player);
            selectLinkedPlayer(playerId);
        });
    });

    // Hazırım butonu
    elements.readyBtn.addEventListener('click', submitGuess);

    // Enter tuşu ile tahmin gönderme
    elements.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitGuess();
        }
    });

    // Yeniden başlat butonu
    elements.restartBtn.addEventListener('click', restartGame);
}

function initializeGame() {
    // Değiştirici profilindeki oyuncular için hedef seçimi
    initializeSwapperTargets();
    updateScoreboard();
    updateGameStatus();
    showProfileSelection();
}

function initializeSwapperTargets() {
    // Değiştirici profilindeki her oyuncu için bir hedef oyuncu seç
    game.players.forEach((player, index) => {
        if (player.profile === 7) {
            const availableTargets = [];
            game.players.forEach((target, targetIndex) => {
                if (targetIndex !== index) {
                    availableTargets.push(targetIndex);
                }
            });
            if (availableTargets.length > 0) {
                game.swapperTargets[index] = availableTargets[Math.floor(Math.random() * availableTargets.length)];
            }
        }
    });
}

function selectProfile(profileId) {
    game.humanProfile = profileId;
    game.players[0].profile = profileId;
    
    if (profileId === 0) { // Bağlantılı profil
        showPlayerSelection();
    } else {
        startFirstRound();
    }
}

function selectLinkedPlayer(playerId) {
    game.linkedPlayer = playerId;
    elements.playerSelection.style.display = 'none';
    startFirstRound();
}

function showProfileSelection() {
    elements.profileSelection.style.display = 'block';
    elements.inputSection.style.display = 'none';
}

function showPlayerSelection() {
    elements.profileSelection.style.display = 'none';
    elements.playerSelection.style.display = 'block';
}

function startFirstRound() {
    elements.profileSelection.style.display = 'none';
    elements.playerSelection.style.display = 'none';
    startRound();
}

function startRound() {
    // Kehanetçi profili kontrolü
    if (game.humanProfile === 8 && isProphecyTurn()) {
        showProphecy();
        return;
    }

    elements.inputSection.style.display = 'block';
    elements.resultSection.style.display = 'none';
    elements.guessInput.value = '';
    elements.guessInput.disabled = false;
    elements.readyBtn.disabled = false;
    
    startTimer();
}

function isProphecyTurn() {
    return game.currentTurn % 3 === 0; // 3, 6, 9, 12... turlarda
}

function showProphecy() {
    // Tahmin edilen hedef sayıyı göster (±5 sapma ile)
    const estimatedTarget = Math.floor(Math.random() * 100);
    const variance = Math.floor(Math.random() * 11) - 5; // -5 ile +5 arası
    const prophecyTarget = Math.max(0, Math.min(100, estimatedTarget + variance));
    
    elements.prophecyTarget.textContent = prophecyTarget;
    elements.prophecyInfo.style.display = 'block';
    elements.inputSection.style.display = 'none';
    
    // 10 saniyelik özel zamanlayıcı
    let prophecyTime = 10;
    elements.prophecyCountdown.textContent = prophecyTime;
    
    game.prophecyTimer = setInterval(() => {
        prophecyTime--;
        elements.prophecyCountdown.textContent = prophecyTime;
        
        if (prophecyTime <= 0) {
            clearInterval(game.prophecyTimer);
            elements.prophecyInfo.style.display = 'none';
            elements.inputSection.style.display = 'block';
            startTimer();
        }
    }, 1000);
}

function startTimer() {
    let timeLeft = 40;
    elements.countdown.textContent = timeLeft;
    
    game.gameTimer = setInterval(() => {
        timeLeft--;
        elements.countdown.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(game.gameTimer);
            timeUp();
        }
    }, 1000);
}

function submitGuess() {
    const guess = parseInt(elements.guessInput.value);
    
    if (isNaN(guess) || guess < 0 || guess > 100) {
        alert('Lütfen 0-100 arasında bir sayı girin!');
        return;
    }
    
    clearInterval(game.gameTimer);
    processRound(guess);
}

function timeUp() {
    // Oyuncu süre içinde tahmin girmedi, +1 puan cezası
    game.players[0].points += 1;
    updateScoreboard();
    
    // Otomatik olarak random sayı gir
    const randomGuess = Math.floor(Math.random() * 101);
    processRound(randomGuess);
}

function processRound(humanGuess) {
    elements.inputSection.style.display = 'none';
    
    // Tüm oyuncuların tahminlerini topla
    game.currentGuesses = [];
    
    // İnsan oyuncusu
    if (game.players[0].active) {
        game.currentGuesses.push({
            player: 0,
            guess: humanGuess,
            name: game.players[0].name
        });
    }
    
    // Bot oyuncuları
    for (let i = 1; i < game.players.length; i++) {
        if (game.players[i].active) {
            let botGuess = generateBotGuess(i);
            
            // Gölge profili - sayıyı gizle
            if (game.players[i].profile === 4 && shouldHideGuess(i)) {
                // Gizli tahmin
                game.currentGuesses.push({
                    player: i,
                    guess: botGuess,
                    name: game.players[i].name,
                    hidden: true
                });
            } else {
                game.currentGuesses.push({
                    player: i,
                    guess: botGuess,
                    name: game.players[i].name
                });
            }
        }
    }
    
    // Değiştirici profili etkisi
    applySwapperEffect();
    
    // Hedef sayıyı hesapla
    const allGuesses = game.currentGuesses.map(g => g.guess);
    const average = allGuesses.reduce((sum, guess) => sum + guess, 0) / allGuesses.length;
    const target = Math.round(average * 0.8);
    
    // Kazananı bul
    const winner = findWinner(target);
    
    // Puanları güncelle
    updatePoints(winner, target);
    
    // Sonuçları göster
    showResults(target, winner);
    
    // Oyun bitişini kontrol et
    setTimeout(() => {
        checkGameEnd();
    }, 10000);
}

function generateBotGuess(playerId) {
    const player = game.players[playerId];
    const profile = player.profile;
    
    // Botlar genel olarak 40 civarında sayılar söylesin
    const baseGuess = () => {
        // 30-45 arasında ağırlıklı dağılım
        if (Math.random() < 0.6) {
            return 35 + Math.floor(Math.random() * 16); // 35-50 arası
        } else {
            return Math.floor(Math.random() * 101); // 0-100 arası
        }
    };
    
    // Profil bazlı tahmin stratejileri
    switch (profile) {
        case 0: // Bağlantılı
            return baseGuess();
            
        case 1: // Kusursuz - bazen tam hedef tahmin etmeye çalışır
            if (Math.random() < 0.3) {
                // Hedef tahmin etmeye çalış (yaklaşık ortalama * 0.8)
                return Math.floor(32 + Math.random() * 16); // 32-47 arası (40*0.8 = 32 civarı)
            }
            return baseGuess();
            
        case 2: // Aşırıcı
            if (Math.random() < 0.25) {
                return 99; // %25 ihtimalle 99
            }
            return baseGuess();
            
        case 3: // Esnekçi - 10-15 fark aralığını hedefler
            if (Math.random() < 0.4) {
                const targetGuess = 25; // Tahmini hedef
                const offset = 12 + Math.floor(Math.random() * 4); // 12-15 fark
                return Math.random() < 0.5 ? targetGuess + offset : targetGuess - offset;
            }
            return baseGuess();
            
        case 4: // Gölge
            return baseGuess();
            
        case 5: // Yaşam - güvenli oynar
            return 16 + Math.floor(Math.random() * 15); // 38-45 arası daha dar
            
        case 6: // Kaosçu - hedefin hemen yanını hedefler
            if (Math.random() < 0.3) {
                const targetGuess = 32; // Tahmini hedef
                return targetGuess + (Math.random() < 0.5 ? 1 : -1); // ±1 fark
            }
            return baseGuess();
            
        case 7: // Değiştirici
            return baseGuess();
            
        case 8: // Kehanetçi - daha iyi tahmin yapar
            return 36 + Math.floor(Math.random() * 16); // 36-45 arası
            
        case 9: // Dönüşümcü
            if ([4, 8, 12].includes(game.currentTurn)) {
                // Özel turlarda farklı strateji
                return 30 + Math.floor(Math.random() * 20); // 30-49 arası
            }
            return baseGuess();
            
        default:
            return baseGuess();
    }
}

function shouldHideGuess(playerId) {
    const player = game.players[playerId];
    
    // Her 2 turda bir gizle
    if (game.currentTurn % 2 === 0) return true;
    
    // En yüksek veya en düşük puandaysa her zaman gizle
    const activePlayers = game.getActivePlayers();
    const points = activePlayers.map(p => p.points);
    const maxPoints = Math.max(...points);
    const minPoints = Math.min(...points);
    
    if (player.points === maxPoints || player.points === minPoints) {
        return true;
    }
    
    return false;
}

function applySwapperEffect() {
    // Değiştirici profili etkisi - %15 ihtimalle hedef oyuncunun sayısını değiştir
    game.players.forEach((player, index) => {
        if (player.profile === 7 && player.active && Math.random() < 0.15) {
            const targetPlayerId = game.swapperTargets[index];
            if (targetPlayerId !== undefined) {
                // Swapper ve hedef oyuncunun tahminlerini bul
                const swapperGuess = game.currentGuesses.find(g => g.player === index);
                const targetGuess = game.currentGuesses.find(g => g.player === targetPlayerId);
                
                if (swapperGuess && targetGuess) {
                    // Sayıları değiştir
                    const temp = swapperGuess.guess;
                    swapperGuess.guess = targetGuess.guess;
                    targetGuess.guess = temp;
                    
                    showSpecialRuleAnnouncement(`${player.name} ${game.players[targetPlayerId].name}'in sayısını değiştirdi!`);
                }
            }
        }
    });
}

function findWinner(target) {
    let bestDistance = Infinity;
    let winners = [];
    
    game.currentGuesses.forEach(g => {
        const distance = Math.abs(g.guess - target);
        if (distance < bestDistance) {
            bestDistance = distance;
            winners = [g];
        } else if (distance === bestDistance) {
            winners.push(g);
        }
    });
    
    // Eğer birden fazla kazanan varsa, rastgele seç
    return winners[Math.floor(Math.random() * winners.length)];
}

function updatePoints(winner, target) {
    const basePenalty = 1;
    
    // Önce normal puan dağıtımını yap - kazanan hariç herkes +1 puan alır
    game.currentGuesses.forEach(g => {
        if (g.player !== winner.player) {
            game.players[g.player].points += basePenalty;
        }
    });
    
    // Elenen oyuncu sayısına göre özel kurallar
    if (game.eliminatedCount >= 1) {
        // Aynı sayıyı giren oyuncular +2 puan daha alır
        const guessGroups = {};
        game.currentGuesses.forEach(g => {
            if (!guessGroups[g.guess]) guessGroups[g.guess] = [];
            guessGroups[g.guess].push(g);
        });
        
        Object.values(guessGroups).forEach(group => {
            if (group.length >= 2) {
                group.forEach(g => {
                    if (g.player !== winner.player) {
                        game.players[g.player].points += 2;
                    }
                });
            }
        });
    }
    
    if (game.eliminatedCount >= 2) {
        // Hedef sayıyı tam bilen varsa diğerleri +2 alır
        const perfectGuess = game.currentGuesses.find(g => g.guess === target);
        if (perfectGuess) {
            game.currentGuesses.forEach(g => {
                if (g.player !== perfectGuess.player) {
                    game.players[g.player].points += 2;
                }
            });
        }
    }
    
    if (game.eliminatedCount >= 3) {
        // 0 ve 100 özel kuralı
        const zeroGuess = game.currentGuesses.find(g => g.guess === 0);
        const hundredGuess = game.currentGuesses.find(g => g.guess === 100);
        
        if (zeroGuess && hundredGuess) {
            // 100 giren otomatik kazanır - winner'ı güncelle
            winner = hundredGuess;
            showSpecialRuleAnnouncement("100 giren oyuncu özel kuralla kazandı!");
        }
    }
    
    // Profil etkilerini uygula
    applyProfileEffects(winner, target);
    
    updateScoreboard();
}

function applyProfileEffects(winner, target) {
    // Her oyuncu için profil etkilerini kontrol et
    game.currentGuesses.forEach(g => {
        const player = game.players[g.player];
        const profile = player.profile;
        
        switch (profile) {
            case 0: // Bağlantılı - ilk 3 turda bağlı oyuncunun durumuna göre etki
   if (g.player === 0 && game.linkedPlayer !== null && game.currentTurn <= 3) {
        const linkedPlayer = game.players[game.linkedPlayer];
        if (linkedPlayer.points === 2) {
            player.points += 2;
        } else if (linkedPlayer.points === 1 || linkedPlayer.points === 3) {
            player.points = Math.max(0, player.points - 2);
        }
   }
   break;
                
            case 1: // Kusursuz - hedefi tam bilirse diğerleri +3 puan alır
                if (g.guess === target) {
                    game.currentGuesses.forEach(other => {
                        if (other.player !== g.player) {
                            game.players[other.player].points += 3;
                        }
                    });
                    showSpecialRuleAnnouncement(`${player.name} tam hedefi buldu! Diğerleri +3 puan ceza aldı!`);
                }
                break;
                
            case 2: // Aşırıcı - 99 girerse %20 ihtimalle -1 puan
                if (g.guess === 99 && Math.random() < 0.2) {
                    player.points = Math.max(0, player.points - 1);
                    showSpecialRuleAnnouncement(`${player.name} şanslı! -1 puan!`);
                }
                break;
                
            case 3: // Esnekçi - hedeften 10-15 fark varsa %50 ihtimalle -2 puan
                const distance = Math.abs(g.guess - target);
                if (distance >= 10 && distance <= 15 && Math.random() < 0.5) {
                    player.points = Math.max(0, player.points - 2);
                    showSpecialRuleAnnouncement(`${player.name} esneklik gösterdi! -2 puan!`);
                }
                break;
                
            case 5: // Yaşam - 10 puana ulaşırsa 9 puana düşer
                if (player.points >= 10) {
                    player.points = 9;
                    showSpecialRuleAnnouncement(`${player.name} ölümden kurtuldu!`);
                }
                break;
                
            case 6: // Kaosçu - kazanandan 1 fark fazla ise herkes +2 puan alır
                const winnerDistance = Math.abs(winner.guess - target);
                const chaosDistance = Math.abs(g.guess - target);
                if (chaosDistance === winnerDistance + 1) {
                    game.currentGuesses.forEach(other => {
                        game.players[other.player].points += 2;
                    });
                    showSpecialRuleAnnouncement(`${player.name} kaos yaratıyor! Herkes +2 puan ceza!`);
                }
                break;
                
            case 9: // Dönüşümcü - 4, 8, 12. turlarda özel güç
                if ([4, 8, 12].includes(game.currentTurn)) {
                    const rand = Math.random();
                    if (rand < 0.4) {
                        // Sadece bu oyuncu ceza yemez
                        if (g.player !== winner.player) {
                            const penalty = game.players[g.player].points > 0 ? 1 : 0;
                            player.points = Math.max(0, player.points - penalty);
                            showSpecialRuleAnnouncement(`${player.name} dönüştü! Ceza almadı!`);
                        }
                    } else if (rand < 0.8) {
                        // Sadece bu oyuncu hariç diğerleri +2 alır
                        game.currentGuesses.forEach(other => {
                            if (other.player !== g.player) {
                                game.players[other.player].points += 2;
                            }
                        });
                        showSpecialRuleAnnouncement(`${player.name} güç kullandı! Diğerleri +2 puan ceza!`);
                    } else {
                        // Herkes +2 alır (bu oyuncu dahil)
                        game.currentGuesses.forEach(other => {
                            game.players[other.player].points += 2;
                        });
                        showSpecialRuleAnnouncement(`${player.name} kaos yarattı! Herkes +2 puan ceza!`);
                    }
                }
                break;
        }
    });
}

function showResults(target, winner) {
    elements.targetNumber.textContent = target;
    elements.roundWinner.textContent = `${winner.name} kazandı!`;
    
    // Tahminleri göster
    let guessesHTML = '';
    game.currentGuesses.forEach(g => {
        const distance = Math.abs(g.guess - target);
        const isWinner = g.player === winner.player;
        const hiddenText = g.hidden ? ' (Gizli)' : '';
        
        guessesHTML += `
            <div class="guess-item ${isWinner ? 'winner' : ''}">
                <span class="guess-player">${g.name}:</span>
                <span class="guess-number">${g.hidden ? '???' : g.guess}${hiddenText}</span>
                <span class="guess-distance">Fark: ${distance}</span>
            </div>
        `;
    });
    
    elements.allGuesses.innerHTML = guessesHTML;
    elements.resultSection.style.display = 'block';
    
    // Önceki zamanlayıcıları temizle
    if (game.nextRoundTimer) {
        clearInterval(game.nextRoundTimer);
    }
    
    // 10 saniyelik bekleme
    let nextRoundTime = 10;
    elements.nextRoundCountdown.textContent = nextRoundTime;
    
    game.nextRoundTimer = setInterval(() => {
        nextRoundTime--;
        elements.nextRoundCountdown.textContent = nextRoundTime;
        
        if (nextRoundTime <= 0) {
            clearInterval(game.nextRoundTimer);
            game.nextRoundTimer = null;
            nextRound();
        }
    }, 1000);
}

function nextRound() {
    // Tüm zamanlayıcıları temizle
    if (game.nextRoundTimer) {
        clearInterval(game.nextRoundTimer);
        game.nextRoundTimer = null;
    }
    
    if (game.gameTimer) {
        clearInterval(game.gameTimer);
        game.gameTimer = null;
    }
    
    // Elenen oyuncuları kontrol et
    checkEliminations();
    
    if (game.getActivePlayerCount() <= 1) {
        endGame();
        return;
    }
    
    game.currentTurn++;
    updateGameStatus();
    elements.resultSection.style.display = 'none';
    startRound();
}

function checkEliminations() {
    let eliminatedThisRound = [];
    
    game.players.forEach((player, index) => {
        if (player.active && player.points >= 10) {
            player.active = false;
            eliminatedThisRound.push(player.name);
            game.eliminatedCount++;
        }
    });
    
    if (eliminatedThisRound.length > 0) {
        showEliminationAnnouncement(eliminatedThisRound);
    }
    
    updateScoreboard();
}

function showEliminationAnnouncement(eliminatedPlayers) {
    const text = eliminatedPlayers.length === 1 
        ? `${eliminatedPlayers[0]} elendi!`
        : `${eliminatedPlayers.join(', ')} elendi!`;
    
    elements.eliminationText.textContent = text;
    elements.eliminationAnnouncement.style.display = 'block';
    
    setTimeout(() => {
        elements.eliminationAnnouncement.style.display = 'none';
    }, 3000);
}

function showSpecialRuleAnnouncement(text) {
    elements.specialRuleText.textContent = text;
    elements.specialRuleAnnouncement.style.display = 'block';
    
    setTimeout(() => {
        elements.specialRuleAnnouncement.style.display = 'none';
    }, 3000);
}

function endGame() {
    // Tüm zamanlayıcıları temizle
    if (game.gameTimer) {
        clearInterval(game.gameTimer);
        game.gameTimer = null;
    }
    if (game.nextRoundTimer) {
        clearInterval(game.nextRoundTimer);
        game.nextRoundTimer = null;
    }
    if (game.prophecyTimer) {
        clearInterval(game.prophecyTimer);
        game.prophecyTimer = null;
    }
    
    const activePlayers = game.getActivePlayers();
    
    if (activePlayers.length === 1) {
        elements.gameWinner.textContent = `${activePlayers[0].name} Kazandı!`;
    } else {
        elements.gameWinner.textContent = "Berabere!";
    }
    
    elements.resultSection.style.display = 'none';
    elements.inputSection.style.display = 'none';
    elements.gameEndSection.style.display = 'block';
}

function updateScoreboard() {
    game.players.forEach((player, index) => {
        const playerElement = document.getElementById(`player-${index}`);
        if (!playerElement) return; // Element yoksa geç
        
        const nameElement = playerElement.querySelector('.player-name');
        const pointsElement = playerElement.querySelector('.player-points');
        const statusElement = playerElement.querySelector('.player-status');
        
        if (nameElement) nameElement.textContent = player.name;
        if (pointsElement) pointsElement.textContent = player.points;
        
        if (statusElement) {
            if (!player.active) {
                statusElement.textContent = 'Elendi';
                playerElement.classList.add('eliminated');
            } else {
                statusElement.textContent = 'Aktif';
                playerElement.classList.remove('eliminated');
            }
        }
        
        // Puan rengini ayarla
        playerElement.classList.remove('danger', 'warning');
        if (player.points >= 8) {
            playerElement.classList.add('danger');
        } else if (player.points >= 5) {
            playerElement.classList.add('warning');
        }
    });
}

function updateGameStatus() {
    if (elements.currentTurn) {
        elements.currentTurn.textContent = `Tur: ${game.currentTurn}`;
    }
    if (elements.remainingPlayers) {
        elements.remainingPlayers.textContent = `Oyuncu: ${game.getActivePlayerCount()}`;
    }
}

function restartGame() {
    // Tüm zamanlayıcıları temizle 
    if (game.gameTimer) {
        clearInterval(game.gameTimer);
        game.gameTimer = null;
    }
    if (game.nextRoundTimer) {
        clearInterval(game.nextRoundTimer);
        game.nextRoundTimer = null;
    }
    if (game.prophecyTimer) {
        clearInterval(game.prophecyTimer);
        game.prophecyTimer = null;
    }
    
    // Oyunu sıfırla
    game = new GameState();
    
    // UI'yi sıfırla
    elements.gameEndSection.style.display = 'none';
    elements.resultSection.style.display = 'none';
    elements.inputSection.style.display = 'none';
    elements.eliminationAnnouncement.style.display = 'none';
    elements.specialRuleAnnouncement.style.display = 'none';
    elements.prophecyInfo.style.display = 'none';
    
    // Oyunu yeniden başlat
    initializeGame();
}
