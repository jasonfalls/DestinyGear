/** @jsx React.DOM */ 

var __DestinyGear__ = {
    piggyback: {
        csrf: "",
        characters: []
    },

    displayName: "",
    membershipType: "",
    membershipId: "",

    rf: {}, // A reference for items
    characters: {},

    kinds: [
        'Auto Rifle',
        'Hand Cannon',
        'Pulse Rifle',
        'Scout Rifle',
        'Fusion Rifle',
        'Shotgun',
        'Sniper Rifle',
        'Machine Gun',
        'Rocket Launcher'
    ]
};
var DG = __DestinyGear__;

function start() {
    NProgress.start();

    $(function(){
        $('body').scrollspy({
            target: '.navbar-sidebar'
        });

        React.render(
            <Page />,
            document.getElementById('page')
        );
    });
}

function chromeSetup(page) {
    var done = false;
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (done) {
            return;
        }
        done = true;
        DG.piggyback.csrf = response.csrf;
        DG.piggyback.characters = response.characters;
        page.load();
    });
    chrome.runtime.sendMessage({ piggybackGet: true }, null, function(response) {
        done = true;
        DG.piggyback.csrf = response.csrf;
        DG.piggyback.characters = response.characters;
        page.load();
    });
}

function getItemSlot(itm) {
    // Auto Rifle 3 6
    // Hand Cannon 3 9
    // Pulse Rifle 3 13
    // Scout Rifle 3 14
    // Fusion Rifle 3 11
    // Shotgun 3 7
    // Sniper Rifle 3 12
    // Machine Gun 3 8
    // Rocket Launcher 3 10
    var key = itm.rf.itemType + "-" + itm.rf.itemSubType;
    if (!key) {}
    else if (key === "3-6")     { return "primary"; }
    else if (key === "3-9")     { return "primary"; }
    else if (key === "3-13")    { return "primary"; }
    else if (key === "3-14")    { return "primary"; }
    else if (key === "3-11")    { return "secondary"; }
    else if (key === "3-7")     { return "secondary"; }
    else if (key === "3-12")    { return "secondary"; }
    else if (key === "3-8")     { return "heavy"; }
    else if (key === "3-10")    { return "heavy"; }
    return "unknown";
}

function getItemProgressLimit(itm) {
    var slot = getItemSlot(itm);
    var key = slot + "-" + itm.rf.tierType;
    if (!key) {}
    else if (key === "primary-3")   { return 6300; }
    else if (key === "primary-4")   { return 40800; }
    else if (key === "primary-5")   { return 189000; }
    else if (key === "primary-6")   { return 285000; }
    else if (key === "secondary-5") { return 142500; }
    else if (key === "secondary-6") { return 237500; }
    else if (key === "heavy-5")     { return 142500; }
    else if (key === "heavy-6")     { return 237500; }
    return 0;
}

function isItemComplete(itm) {
    if (!itm || !itm.nodes || !itm.nodes.length) {
        return false;
    }

    var active = 0;
    for (var node in itm.nodes) {
        if (itm.nodes[node].isActivated) {
            active++;
        }
    }
    var total = itm.nodes.length;
    if      (total === 17) { return active === 12; }
    else if (total === 16) { return active === 12; }
    else if (total === 15) { return active === 11; }
    else if (total === 14) { return active === 10; }
    else if (total === 11) { return active === 7; }
    else if (total === 9) { return active === 6; }
    else if (total === 5) { return active === 4; }
    return false;
}

function isItemExotic(itm) {
    if (!itm || !itm.rf) {
        return false;
    }
    return itm.rf.tierType === 6;
}

function isItemWeapon(itm) {
    if (!itm || !itm.rf) {
        return false;
    }
    return itm.rf.itemType === 3;
}

function getItemProgress(itm) {
    var limit = getItemProgressLimit(itm);
    if (!limit) {
        return 0;
    }
    return itm.progression.currentProgress / limit;
}

function charactersList(without) {
    var list = [];
    for (chr in DG.characters) {
        if (chr === without) {
            continue;
        }
        list.push(DG.characters[chr]);
    }
    list.sort(function(a, b) {
        if (a.characterId < b.characterId) {
            return -1;
        }
        if (a.characterId > b.characterId) {
            return 1;
        }
        return 0;
    });
    return list;
}

function getChrItems(putItem, chrId, characterId, csrf) {
    var url = "https://www.bungie.net/en/Legend/" + chrId;
    return $.ajax({
        method: "GET",
        url: url,
        headers: {
            "X-API-Key": "10E792629C2A47E19356B8A79EEFA640",
            "X-CSRF": csrf
        },
        success: function (data) {
            //var value = data.match(/tempModel.equippables = (\[\{"items":.*)\s*tempModel.gearAssets =/m);
            var value = data.match(/DEFS.items,\s+(\{[^\n]*\})\);\s*$/m);
            var values = JSON.parse(value[1]);

            for (var itm in values) {
                DG.rf[itm] = values[itm];
            }

            value = data.match(/tempModel.equippables = (\[.*]);\s*$/m);
            values = JSON.parse(value[1]);
            for (var itm in values) {
                itm = values[itm];
                if (itm.items) {
                    for (var itm_ in itm.items) {
                        itm_ = itm.items[itm_];
                        itm_.characterId = characterId;
                        putItem(itm_);
                    }
                }
            }
        },
        error: function(err) {
            console.log(err);
        }
    });
}

function getVaultItems(putItem, csrf) {
    if (csrf) {
        return $.ajax({
            method: "GET",
            url: "https://www.bungie.net/Platform/Destiny/2/MyAccount/Vault/?lc=en&fmt=true&lcin=true&definitions=true",
            headers: {
                "X-API-Key": "10E792629C2A47E19356B8A79EEFA640",
                "X-CSRF": csrf
            },
            success: function(data) {
                var Response = data.Response;
                var values = Response.definitions.items;
                for (var itm in values) {
                    DG.rf[itm] = values[itm];
                }
                values = Response.data.buckets[2].items;
                for (var itm in values) {
                    itm = values[itm];
                    itm.characterId = "vault";
                    putItem(itm);
                }
            },
            error: function(err) {
            }
        });
    }
}

var EquipItem = React.createClass({
    equipItem: function(item, itemInFocus, event) {
        event.preventDefault();
        if (!itemInFocus) {
            itemInFocus = item;
        }
        this.props.equipItem(item, itemInFocus);
    },
    
    render: function() {
        var self = this;
        var item = this.props.item;
        var classes = React.addons.classSet({
            'btn': true,
            'btn-sm': true,
            'btn-primary': true,
            'ctl': true,
            'ctl-equip': true
        });
        if (item.isEquipped) {
            var items = this.props.itemsInSlot(item.characterId, item.dgrf.slot);
            return <span>
                {items.map(function(itm){
                    return <span className="ctl ctl-equip">
                        <a href="#" onClick={self.equipItem.bind(self, itm, item)}>
                            <img className="ctl-icon" src={"http://bungie.net" + itm.rf.icon} />
                        </a>
                    </span>
                })}
            </span>
        }
        return <button onClick={this.equipItem.bind(this, this.props.item, null)} className={classes}>
            Equip
        </button>
    }
});

var MoveItem = React.createClass({
    moveItem: function(characterId, event) {
        event.preventDefault();
        this.props.moveItem(this.props.item, characterId);
    },
    
    render: function() {
        var self = this;
        if (this.props.item.characterId === "vault") {
            var characters = charactersList();
            if (!characters.length) {
                return null;
            }
            return <span>
                {characters.map(function(chr){
                    return <span className="ctl ctl-move">
                        <a href="#" onClick={self.moveItem.bind(self, chr.characterId)}>
                            <img className="ctl-icon" src={"http://bungie.net" + chr.bungie.emblemPath}/>
                        </a>
                    </span>
                })}
            </span>
        }
        return <span className="ctl ctl-move">
            <a href="#" onClick={self.moveItem.bind(self, null)}>
                <img className="ctl-icon" src="vault.png" />
            </a>
        </span>
    }
});

var Item = React.createClass({
    
    render: function() {
        var item = this.props.item;

        var props = {
            item: item,
            moveItem: this.props.moveItem,
            equipItem: this.props.equipItem,
            itemsInSlot: this.props.itemsInSlot,
            canEquipExoticWeapon: this.props.canEquipExoticWeapon
        };

        var character = DG.characters[item.characterId];
        var owner; 
        if (character) {
            owner = <span className="owner">
                    <img className="chr-icon" src={"http://bungie.net" + character.bungie.emblemPath}/>
            </span>
        } else {
            owner = <span className="owner">
                    <img className="chr-icon" src={"vault.png"}/>
            </span>
        }

        var move = <MoveItem {...props} />
        var equip;
        if (item.dgrf.canEquip) {
            equip = <EquipItem {...props} />
            if (item.isEquipped) {
                move = null;
            }
        }

        var notice;
        if (item.dgctx.inprogress) {
            notice = <span className="spinner"><span className="spinner-icon"></span></span>
        }

        var complete = item.dgrf.complete;
        var progress = getItemProgress(item);
        if (!complete && progress) {
            progress = <span className="itm-icon-progress" style={{ "width": progress * 100 + "%" }}></span>
        } else {
            progress = null;
        }

        var classes = React.addons.classSet({
            'item': true,
            'row': true,
            'itm-complete': complete,
            'itm-incomplete': !complete
        });

        return <div className={classes}>
            <div className="col-md-10">
                <span className="itm-icon" style={{ "background-image": "url(\"http://bungie.net" + item.rf.icon + "\")" }}>
                    {progress}
                </span>
                <p>{item.rf.itemName}</p>
                <p>
                    {owner}
                    <span className="controls">
                        {equip}{move}
                    </span>
                    <span>{notice}</span>
                </p>
            </div>
        </div>
    }
});

var ItemSection = React.createClass({
    render: function() {
        var kind = this.props.kind;
        var items = this.props.items[kind];
        if (!items || !items.length) {
            return null;
        }
        items.sort(function(a, b){
            if (a.rf.itemName > b.rf.itemName) {
                return 1;
            }
            if (a.rf.itemName < b.rf.itemName) {
                return -1;
            }
            if (a.itemInstanceId > b.itemInstanceId) {
                return 1;
            }
            if (a.itemInstanceId < b.itemInstanceId) {
                return -1;
            }
            return 0;
        });

        var props = {
            moveItem: this.props.moveItem,
            equipItem: this.props.equipItem,
            itemsInSlot: this.props.itemsInSlot,
            canEquipExoticWeapon: this.props.canEquipExoticWeapon
        };

        return <div id={this.props.anchor} className="item-section">
            <a className="item-section-anchor" name={this.props.anchor}></a>
            <div className="row">
                <div className="col-md-10">
                    <h3 className="item-section-h3">{kind}</h3>
                </div>
            </div>
            {items.map(function(item){
                item.kind = kind;
                return <Item {...props} item={item}/>
            })}
        </div>
    }
});

var Character = React.createClass({
    render: function() {
        var level = this.props.level;
        var classes = React.addons.classSet({
            'plate': true,
            'plate-lit': level > 20
        });
        var description = "";
        description = <div className={classes} style={{ backgroundImage: "url(" + "http://bungie.net" + this.props.bungie.backgroundPath + ")" }}>
            <img className="plate-emblem" src={ "http://bungie.net" + this.props.bungie.emblemPath }/>
            <div className="plate-class">{this.props.className}</div>
            <div className="plate-race-gender">{this.props.raceGender}</div>
            <div className="plate-level">{level}</div>
            <div className="plate-grimoire">{this.props.grimoireScore}</div>
        </div>
        return <div className="row">
            <div className="col-md-4">
                {description}
            </div>
        </div>
    }
});

var Page = React.createClass({
    moveItem: function(item, characterId) {
        var self = this;
        item.dgctx = {
            inprogress: true
        };
        self.forceUpdate();

        var transferToVault = false;
        if (!characterId) {
            transferToVault = true;
            characterId = item.characterId;
        }

        $.ajax({
            url: "https://www.bungie.net/Platform/Destiny/TransferItem/?lc=en&fmt=true&lcin=true",
            method: "POST",
            type: "application/json",
            headers: {
                "X-API-Key": "10E792629C2A47E19356B8A79EEFA640",
                "X-CSRF": DG.piggyback.csrf
            },
            data: JSON.stringify({
                membershipType: 2,
                characterId: characterId,
                itemId: item.itemInstanceId,
                itemReferenceHash: item.itemHash,
                stackSize: 1,
                transferToVault: transferToVault
            }),
            success: function(data) {
                var items = self.state.items;
                item.dgctx = {};
                if (data.ErrorCode === 1) {
                    if (transferToVault) {
                        item.characterId = "vault";
                        item.canEquip = false;
                    } else {
                        item.characterId = characterId;
                        item.canEquip = true; // FIXME Maybe not for consumables...
                    }
                    self.forceUpdate();
                } else {
                    self.setState({
                        notice: data.Message
                    });
                }
            },
            error: function(err) {
                console.log("error", err);
            }
        });
    },

    equipItem: function(item, itemInFocus) {
        var self = this;
        itemInFocus.dgctx = {
            inprogress: true
        };
        self.forceUpdate();

        $.ajax({
            url: "https://www.bungie.net/Platform/Destiny/EquipItem/?lc=en&fmt=true&lcin=true",
            method: "POST",
            type: "application/json",
            headers: {
                "X-API-Key": "10E792629C2A47E19356B8A79EEFA640",
                "X-CSRF": DG.piggyback.csrf
            },
            data: JSON.stringify({
                membershipType: 2,
                characterId: item.characterId,
                itemId: item.itemInstanceId
            }),
            success: function(data) {
                // FIXME Need to unequip the other item...
                var items = self.state.items;
                itemInFocus.dgctx = {};
                if (data.ErrorCode === 1) {
                    var oldItem = self.itemActiveInSlot(item.characterId, item.dgrf.slot);
                    if (oldItem) {
                        oldItem.isEquipped = false;
                    }
                    item.isEquipped = true;
                    self.forceUpdate();
                } else {
                    console.log(data);
                    self.setState({
                        notice: data.Message
                    });
                }
            },
            error: function(err) {
                console.log("error", err);
            }
        });
    },

    getInitialState: function() {
        return { items: {} };
    },

    load: function() {
        var self = this;

        var displayName = "";
        var membershipType = "";
        var membershipId = "";

        var characters = {};
        var characterId;
        for (chr in DG.piggyback.characters) {
            chr = DG.piggyback.characters[chr];

            characterId = chr.characterId;
            characters[chr.characterId] = chr;

            if (chr.displayName) {
                displayName = chr.displayName;
            }
            if (chr.membershipType) {
                membershipType = chr.membershipType;
            }
            if (chr.membershipId) {
                membershipId = chr.membershipId;
            }

            chrId = membershipType + "/" + membershipId + "/" + characterId;
            chr.chrId = chrId;
        }

        DG.displayName = displayName;
        DG.membershipType = membershipType;
        DG.membershipId = membershipId;

        self.setState({
            displayName: DG.displayName
        });
        self.loadCharacters(characters);
    },

    loadCharacters: function(characters) {
        var self = this;

        $.ajax({
            url: "http://www.bungie.net/Platform/Destiny/"+DG.membershipType+"/Account/"+DG.membershipId+"/",
            method: "GET",
            success: function(data) {
                var bungie = data.Response.data.characters;
                var chrId, characterId;
                for (var chr in bungie) {
                    chr = bungie[chr];
                    characterId = chr.characterBase.characterId;

                    characters[characterId].bungie = chr;
                }
                self.loadItems(characters);
                DG.characters = characters;
                self.setState({
                    characters: characters
                });
            }
        });
    },

    loadItems: function(characters) {
        var self = this;

        var items = {};
        var putItem = function(itm) {
            if (!itm) {
                return;
            }
            itm.dgctx = {};
            itm.rf = DG.rf[itm.itemHash];
            itm.dgrf = {
                slot: getItemSlot(itm), // primary, secondary, ...
                progressLimit: getItemProgressLimit(itm),
                isExotic: isItemExotic(itm),
                isWeapon: isItemWeapon(itm)
            };
            itm.dgrf.canEquip = itm.dgrf.isWeapon;
            itm.dgrf.complete = isItemComplete(itm);
            if (!itm.rf) {
                return;
            }
            items[itm.itemInstanceId] = itm;
        };

        var gets = [];
        for (var chr in characters) {
            chr = characters[chr];
            gets.push(getChrItems(putItem, chr.chrId, chr.characterId, DG.piggyback.csrf));
        }
        gets.push(getVaultItems(putItem, DG.piggyback.csrf));

        $.when(gets[0], gets[1], gets[2], gets[3]).done(function(){
            NProgress.done();
            self.setState({
                items: items
            });
        });
    },

    componentDidMount: function() {
        chromeSetup(this);
    },

    canEquipExoticWeapon: function(characterId) {
        var items = [];
        for (itm in this.state.items) {
            itm = this.state.items[itm];
            if (!itm.isEquipped) {
                continue;
            }
            if (!itm.dgrf.isWeapon) {
                continue;
            }
            if (itm.dgrf.isExotic) {
                return false;
            }
        }
        return true;
    },

    itemsInSlot: function(characterId, slot) {
        var items = [];
        for (itm in this.state.items) {
            itm = this.state.items[itm];
            if (itm.characterId !== characterId) {
                continue;
            }
            if (itm.dgrf.slot !== slot) {
                continue;
            }
            items.push(itm);
        }
        return items;
    },

    itemActiveInSlot: function(characterId, slot) {
        for (itm in this.state.items) {
            itm = this.state.items[itm];
            if (itm.characterId !== characterId) {
                continue;
            }
            if (itm.dgrf.slot !== slot) {
                continue;
            }
            if (itm.isEquipped) {
                return itm;
            }
        }
        return null;
    },

    itemsByKind: function() {
        var items = {};
        for (var itm in this.state.items) {
            itm = this.state.items[itm];
            var itemTypeName = itm.rf.itemTypeName;
            if (!items[itemTypeName]) {
                items[itemTypeName] = [];
            }
            items[itemTypeName].push(itm);
        }
        return items;
    },

    closeNotice: function() {
        this.setState({ notice: null });
    },

    componentDidUpdate: function() {
    },

    render: function() {
        var items = this.itemsByKind();
        var props = {
            items: items,
            moveItem: this.moveItem.bind(this),
            equipItem: this.equipItem.bind(this),
            itemsInSlot: this.itemsInSlot.bind(this),
            canEquipExoticWeapon: this.canEquipExoticWeapon.bind(this)
        };
        var notice = this.state.notice;
        if (notice) {
            notice = <div className="notice">
                <div className="alert alert-warning alert-dismissible">
                    <button onClick={this.closeNotice} type="button" className="close" aria-label="Close">
                        <span aria-hidden="true">{'\u00d7'}</span>
                    </button>
                    {notice}
                </div>
            </div>
        }
        var cnt = function(name) {
            if (!items[name]) {
                return "";
            }
            return items[name].length;
        };

        var title = "destiny";
        if (this.state.displayName) {
            title += " // " + this.state.displayName;
            $('title').text(this.state.displayName + " // destiny")
        }

        var left = [];
        var right = [];
        var anchor;

        var kinds = DG.kinds;
        if (left.length) { // false
            kinds = []
            for (var kind in items) {
                kinds.push(kind);
            }
        }

        for (var kind in kinds) {
            kind = kinds[kind];
            if (!items[kind]) {
                continue;
            }
            anchor = kind.replace(" ", "-");
                //<li><a href={"#" + anchor}>{kind}</a></li>
            left.push(
                <li><a href={"#" + anchor}>{kind} <span className="badge">{cnt(kind)}</span></a></li>
            )
            right.push(
                <ItemSection {...props} anchor={anchor} kind={kind}/>
            )
        }

        var characters = [];
        for (var chr in this.state.characters) {
            chr = this.state.characters[chr];
            characters.push(<Character {...chr}/>)
        }

        return <div>
            {notice}
            <nav className="navbar navbar-inverse navbar-fixed-top">
                <div className="container-fluid">
                    <div className="navbar-header">
                        <span className="navbar-brand">{title}</span>
                    </div>
                </div>
            </nav>
            <div className="body container">
                <div className="row">
                    <div className="col-md-2">
                        <div className="navbar-sidebar" data-spy="affix">
                            <ul className="nav">
                                <li>
                                    <a href="#Weapons">Weapons</a>
                                    <ul className="nav">
                                    {left}
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="col-md-10" data-spy="scroll">
                        <div className="plates">
                            {characters}
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="plate plate-vault">
                                        <img className="plate-emblem" src="vault.png" />
                                        <div className="plate-class">Vault</div>
                                        <div className="plate-race-gender">The Last City, Earth</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <a name="Weapons"></a>
                            {right}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
});

$(function(){
    start();
});
