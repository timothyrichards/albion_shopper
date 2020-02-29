// API Data
let prices = "https://www.albion-online-data.com/api/v2/stats/Prices/";
let charts = "https://www.albion-online-data.com/api/v2/stats/Charts/";
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
let chart_data;
let timestamp_options = {  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };

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
function buildURL(url, items, enchant, quality, location) {
    let ajax_url =  url+items+enchant+'?locations='+location;
    if (quality !== 0)
        ajax_url += '&qualities='+quality;
    return encodeURI(ajax_url);
}

// Builds the historical data chart
function drawChart() {
    let data = google.visualization.arrayToDataTable(chart_data);

    let options = {
        title: 'Average Price History',
        hAxis: {title: 'Time',  titleTextStyle: {color: '#333'}},
        vAxis: {minValue: 0}
    };

    let chart = new google.visualization.AreaChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}

// Initialization
$(document).ready( function () {
    // Set up filter input control group
    $('.controlgroup').controlgroup();

    // Hide loading gif by default
    $('#loading').hide();

    // Initialize dialog
    $('#dialog').dialog({
        autoOpen: false,
        modal: true,
        height: 'auto',
        width: 'auto'
    });

    // Item ID's: https://github.com/broderickhyman/ao-bin-dumps/blob/master/formatted/items.txt
    // Get list of all items
    // $.getJSON('https://raw.githubusercontent.com/broderickhyman/ao-bin-dumps/master/formatted/items.json', function(data) {
    //     items = data;
    // });
});

// Bind click to close dialog
$(document).on('click', '.ui-widget-overlay', function () {
    $("#dialog").dialog('close');
});

// On submit button click
$(document).on('click', '#submit', function () {
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
    $.when(
        $.each(locations, function (key, location) {
            let container_id = location.replace(/\s+/g, '-').toLowerCase();
            let html;

            // Create container for items list
            html = "<div id='"+container_id+"'>";
            html += "<h1>"+location+"</h1>";
            $.ajax({
                url: buildURL(prices, item, enchant, quality, location),
                success: function (data) {
                    $.when(
                        $.each(data, function (key, value) {
                            let regex = /T*_(.*_.*_SET.)/g;
                            let match = regex.exec(value['item_id']);
                            let buy_date = new Date(value['buy_price_min_date']);
                            let sell_date = new Date(value['sell_price_min_date']);

                            // Get list of items as cards
                            let html = "<div class='card' data-item-name='"+value["item_id"]+"' data-item-enchant='"+enchant+"' data-item-quality='"+value["quality"]+"' data-item-location='"+location+"'>";
                            if (value['quality'] > 0)
                            {
                                let price = container_id === "black-market" ? value['buy_price_min'].toLocaleString() : value['sell_price_min'].toLocaleString();
                                let date = container_id === "black-market" ? buy_date.toLocaleTimeString('en-us', timestamp_options) : sell_date.toLocaleTimeString('en-us', timestamp_options);

                                html += "<p>Item: "+tier+enchant+" "+$('option[value='+match[1]+']').html()+"</p>";
                                html += "<p>Quality: "+$('option[value='+value['quality']+']').html()+"</p>";
                                html += "<p><b>Price: "+price.toLocaleString()+"</b></p>";
                                html += "<p>"+date+"</p>";
                            }
                            else
                                html += "<p>No results found.</p>";
                            html += "</div>";

                            // Append cards to their container
                            $(html).appendTo($("#"+container_id+""))
                        })
                    ).then(function () {
                        $('#loading').hide();
                        $('#wrapper').show();
                    });
                }
            });
            html += "</div>";

            // Append html to the page
            $(html).appendTo($('#wrapper'));
        })
    );
});

// On card click
$(document).on('click', '.card', function () {
    let data_item_name = $(this).attr('data-item-name');
    let data_item_enchant = $(this).attr('data-item-enchant');
    let data_item_quality = $(this).attr('data-item-quality');
    let data_item_location = $(this).attr('data-item-location');

    $.ajax({
        url: buildURL(charts, data_item_name, data_item_enchant, data_item_quality, data_item_location),
        success: function (data) {
            // Get historical data for the chart
            let price_data = data[0].data;
            chart_data = [['Time', 'Price']];
            $.each(price_data.timestamps, function (key, value) {
                let date = new Date(value);
                chart_data.push([date.toLocaleTimeString('en-us', timestamp_options), price_data.prices_avg[key]]);
            });

            // Populate chart
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(drawChart);

            // Open and recenter dialog
            $("#dialog").dialog('open');
            $("#dialog").dialog("option", "position", {my: "center", at: "center", of: window});
        }
    });
});