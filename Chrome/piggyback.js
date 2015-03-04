var csrf = document.cookie.match(/bungled=(\d+)/)[1];
var characters = [];
$('a.characterPlate').each(function(){
    var $this = $(this);
    var href = $this.attr('data-originalhref');
    href = href.split('/');
    var chr = {
        membershipType: href[3],
        membershipId: href[4],
        characterId: href[5],
        displayName: $this.find('.displayName').text(),
        className: $this.find('.className').text(),
        raceGender: $this.find('.raceGender').text(),
        level: $this.find('.powerLevel').text(),
        grimoireScore: $this.find('.grimoireScore').text()
    };
    characters.push(chr);
});

if (csrf && characters.length) {
    chrome.runtime.sendMessage({
        piggybackSet: true,
        csrf: csrf,
        characters: characters
    });
}
