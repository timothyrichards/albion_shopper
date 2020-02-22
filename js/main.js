// Item ID's: https://github.com/broderickhyman/ao-bin-dumps/blob/master/formatted/items.txt

// API Data
let url = "https://www.albion-online-data.com/api/v2/stats/Prices/";
let locations = [
    'Black Market',
    'Caerleon',
    'Thetford',
    'Fort Sterling',
    'Lymhurst',
    'Bridgewatch',
    'Martlock'
];
let items;

// Filters
let tier;
let item;
let enchant;
let quality;

// Get a list of items based on armor type
function itemList(armor_type) {
    armor_type = armor_type.toUpperCase();

    return [
        `${tier}_ARMOR_${armor_type}_SET1`,
        `${tier}_ARMOR_${armor_type}_SET2`,
        `${tier}_ARMOR_${armor_type}_SET3`,
        `${tier}_HEAD_${armor_type}_SET1`,
        `${tier}_HEAD_${armor_type}_SET2`,
        `${tier}_HEAD_${armor_type}_SET3`,
        `${tier}_SHOES_${armor_type}_SET1`,
        `${tier}_SHOES_${armor_type}_SET2`,
        `${tier}_SHOES_${armor_type}_SET3`
    ];
}

// Build ajax call URL
function buildURL(items, enchant, quality, location) {
    return encodeURI(url+items+enchant+'?locations='+location+'&qualities='+quality);
}

$(document).ready( function () {
    // Set up filter input control group
    $('.controlgroup').controlgroup();
    $('#loading').hide();

    // Get list of all items
    // $.getJSON('https://raw.githubusercontent.com/broderickhyman/ao-bin-dumps/master/formatted/items.json', function(data) {
    //     items = data;
    // });
}).on('click', '#submit', function () {
    // Update filters from inputs
    tier = $('#tier').val();
    item = $('#item').val();
    enchant = $('#enchant').val();
    quality = $('#quality').val();

    // If selector is set to 'All' get all the items
    if (item === "All")
        item = itemList('cloth').concat(itemList('leather'), itemList('plate')).join(',');
    else
        item = `${tier}_${item}`;

    // Empty the wrapper for the new results
    $('#loading').show();
    $('#wrapper').empty().hide();

    // Get the new results
    let results = [];
    $.when(
        $.each(locations, function (key, value) {
            let container_id = value.replace(/\s+/g, '-').toLowerCase();
            let html;

            // Create container for items list
            html = "<div id='"+container_id+"'>";
            html += "<h1>"+value+"</h1>";

            $.ajax({
                url: buildURL(item, enchant, quality, value),
                success: function (data) {
                    results.push(data);
                    $.when(
                        $.each(data, function (key, value) {
                            let regex = /T*_(.*_.*_SET.)/g;
                            let match = regex.exec(value['item_id']);
                            let options = {  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
                            let buy_date = new Date(value['buy_price_min_date']);
                            let sell_date = new Date(value['sell_price_min_date']);

                            // Get list of items as cards
                            let html = "<div class='card'>";

                            if (value['quality'] > 0)
                            {
                                html += "<p>Item: "+tier+enchant+" "+$('option[value='+match[1]+']').html()+"</p>";
                                html += "<p>Quality: "+$('option[value='+value['quality']+']').html()+"</p>";
                                if (container_id === "black-market")
                                {
                                    html += "<p><b>Price: "+value['buy_price_min'].toLocaleString()+"</b></p>";
                                    html += "<p>Updated: "+buy_date.toLocaleTimeString('en-us', options)+"</p>";
                                }
                                else
                                {
                                    html += "<p><b>Price: "+value['sell_price_min'].toLocaleString()+"</b></p>";
                                    html += "<p>Updated: "+sell_date.toLocaleTimeString('en-us', options)+"</p>";
                                }
                            }
                            else
                                html += "<p>No results found.</p>";

                            html += "</div>";
                            $(html).appendTo($("#"+container_id+""))
                        })
                    ).then(function () {
                        $('#loading').hide();
                        $('#wrapper').show();
                    });
                }
            });

            html += "</div>";
            $(html).appendTo($('#wrapper'));
        })
    ).then(function () {
        console.log(results);
    });
});