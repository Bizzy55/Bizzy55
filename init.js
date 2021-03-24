jQuery(document).ready(function(){
	if(jQuery('#search_jobs').length > 0){
		Init(jQuery);
	}
});

/* INIT */
function Init($){
var $_container = $('#search_jobs').eq(0);
if($_container.length == 0)return;

/* CONFIG */
var empty_result_msg = 'Data not available';
var not_exist_msg = 'Data not exists for this job';
var empty_field_msg = 'Please fill search field';
var loading_msg = 'Loadingx...';
var no_data = 'No Data';

var API_url = 'http://api.lmiforall.org.uk/api/v1/';
var soc_url = API_url+'soc/search';
var ashe_hours_url = API_url+'ashe/estimateHours';
var ashe_pay_url = API_url+'ashe/estimatePay';
var wf_prediction_ni_url = API_url+'wf/predict/breakdown/region';
var wf_prediction_uk_url = API_url+'wf/predict';
var wf_gender_url = API_url+'wf/predict/breakdown/gender';
var wf_industry_url = API_url+'wf/predict/breakdown/industry';

var gender_mail_color = '#36A2EB';
var gender_femail_color = '#FF6384';
var UK_color = '#36A2EB';
var NI_color = '#FF6384';
var currency = ' GBP'; 

var min_year = (new Date()).getFullYear();
var max_year = 2022;

/* VARIABLES */
var $_search = $_container.find('.search_jobs_form .text').eq(0);
var $_msg = $_container.find('.search_jobs_form .msg').eq(0);

var $_list = $_container.find('.list').eq(0);
var $_details = $_container.find('.search_jobs_details').eq(0);
var $_back_btn = $_details.find('button');

var $_title = $_details.find('.title').eq(0);
var $_description = $_details.find('.description').eq(0);
var $_tasks = $_details.find('.tasks').eq(0);
var $_qualifications = $_details.find('.qualifications').eq(0);
var $_hours_earnings = $_details.find('.hours_earnings').eq(0);
var $_job_future_ni = $_details.find('.job_future_ni').eq(0);
var $_job_future_uk = $_details.find('.job_future_uk').eq(0);
var $_gender = $_details.find('.gender').eq(0);
var $_industry = $_details.find('.industry').eq(0);

var searches = {};
var search_value;
var search_id;

$_details.prepend('<i onclick="print()" class="fa fa-print" aria-hidden="true"></i>');

/* EVENTS */
$_search.keydown(function(ev){
	ev.stopPropagation();
	if(ev.which == 13){
		$_msg.text('');
		if($_search.val().trim() == ''){
			$_msg.text(empty_field_msg);
		}else{
			read_soc($_search.val().trim());
		}
	}
});
$_search.val('');
$_back_btn.click(function(ev){
	ev.stopPropagation();
	$_container.removeClass('details_show');
	$('html, body').animate({scrollTop:$_container.offset().top-30},0);
});
$_list.delegate('li','click',function(ev){
	ev.stopPropagation();
	$(this).addClass('selected');
	$_container.addClass('details_show');
	search_id = $(this).index();
	create_details(searches[search_value][search_id]);	
	$('html, body').animate({scrollTop:$_container.offset().top-30},0);
});

/* FUNCTIONS */
/* JOBS */
/* read_soc */
function read_soc(search){
search_value = search;
if(typeof searches[search_value] != 'undefined'){
	display_jobs_list(searches[search_value]);
	return;
}
$_msg.text(loading_msg);
$.get(
	soc_url,
	{
		q:search
	},
	function(result){
		$_msg.text('');
		searches[search_value] = result;
		display_jobs_list(result);
	},
	'json'
);
}
/* display jobs list */
function display_jobs_list(data){
	var html = '';
	for(var i=0; i < data.length; i++){
		if(data[i].title)
			html += '<li>'+data[i].title+'</li>';
	}
	$_list.html(html);
	if(data.length == 0){
		$_msg.text(not_exist_msg);
	}
}

/* DETAILS */
/* create details */
function create_details(data){
	$_title.text('');
	$_description.text('');
	$_tasks.text('');
	$_qualifications.text('');
	$_hours_earnings.text('');
	$_job_future_ni.text('');
	$_job_future_uk.text('');
	$_gender.text('');
	$_industry.text('');
	
	if(typeof data.title != 'undefined')
		$_title.text(data.title);
	if(typeof data.description != 'undefined')
		$_description.text(data.description);
	if(typeof data.tasks != 'undefined'){
		var tasks_ar = data.tasks.split(';');
		var html = '';
		for(var i=0; i < tasks_ar.length; i++){
			html += '<li>'+tasks_ar[i]+'</li>';
		}
		$_tasks.html(html);		
	}
	if(typeof data.qualifications != 'undefined')
		$_qualifications.text(data.qualifications);
	
	if(typeof data.soc != 'undefined'){	
		read_hours_earnings(data.soc);
		read_job_future(wf_prediction_ni_url,data.soc,'NI');
		read_job_future(wf_prediction_uk_url,data.soc,'UK');
		read_gender(data.soc);
		read_industry(data.soc);
	}	
	
}

/* HOURS AND EARNINGS */
/* read ashe */
function read_ashe(count,url,data,result_data){
if(typeof searches[search_value][search_id]['ashe'] != 'undefined'){
	create_hours_earnings(searches[search_value][search_id]['ashe']);
	return;
}
$_hours_earnings.html(loading_msg);
var ajax = $.get(
	url,
	data,
	function(result){
		if(count == 0){
			if(typeof result.series != 'undefined' && result.series.length > 0)
				result_data['UK']['hours'] = result.series[result.series.length-1]['hours'];
			read_ashe(1,ashe_hours_url,{soc:data.soc,filters:"region:12"},result_data);
		}else if(count == 1){
			if(typeof result.series != 'undefined' && result.series.length > 0)
				result_data['NI']['hours'] = result.series[result.series.length-1]['hours'];
			read_ashe(2,ashe_pay_url,{soc:data.soc},result_data);
		}else if(count == 2){
			if(typeof result.series != 'undefined' && result.series.length > 0)
				result_data['UK']['pay'] = result.series[result.series.length-1]['estpay']+currency;
			read_ashe(3,ashe_pay_url,{soc:data.soc,filters:"region:12"},result_data);
		}else if(count == 3){
			if(typeof result.series != 'undefined' && result.series.length > 0)
				result_data['NI']['pay'] = result.series[result.series.length-1]['estpay']+currency;
			searches[search_value][search_id]['ashe'] = result_data;
			create_hours_earnings(result_data);
		}	
	},
	'json'
);
ajax.fail(function(){
	$_hours_earnings.html(empty_result_msg);
});
}
/* read hours earnings */
function read_hours_earnings(soc){
read_ashe(0,ashe_hours_url,{soc:soc},{'UK':{'hours':'','pay':''},'NI':{'hours':'','pay':''}});
}
/* create hours earnings */
function create_hours_earnings(data){
	var html = '';
	html += '<table>';
	html += '<tr>';
	html += '<th>&nbsp;</th>';
	html += '<th>Weekly Hours</th>';
	html += '<th>Weekly Pay</th>';
	html += '<th>Annual Pay</th>';
	html += '</tr>';
	html += '<tr>';
	html += '<td class="col1">UK</td>';
	html += '<td>'+((data['UK']['hours']!='')?data['UK']['hours']:no_data)+'</td>';
	html += '<td>'+((data['UK']['pay']!='')?data['UK']['pay']:no_data)+'</td>';
	html += '<td>'+(!isNaN(parseFloat(data['UK']['pay'])*52)?parseFloat(data['UK']['pay'])*52+currency:no_data)+'</td>';
	html += '</tr>';
	html += '<tr>';
	html += '<td class="col1">N.Ireland</td>';
	html += '<td>'+((data['NI']['hours']!='')?data['NI']['hours']:no_data)+'</td>';
	html += '<td>'+((data['NI']['pay']!='')?data['NI']['pay']:no_data)+'</td>';
	html += '<td>'+(!isNaN(parseFloat(data['NI']['pay'])*52)?parseFloat(data['NI']['pay'])*52+currency:no_data)+'</td>';
	html += '</tr>';
	html += '</table>';
	$_hours_earnings.html(html);
}

/* JOB FUTURE */
/* read job future */
function read_job_future(url,soc,country){
if(typeof searches[search_value][search_id]['prediction_'+country] != 'undefined'){
	create_job_future(searches[search_value][search_id]['prediction_'+country],country);
	return;
}
$_job_future_ni.html(loading_msg);
var ajax = $.get(
	url,
	{
		soc: soc,
		minYear: min_year,
		maxYear: max_year
	},
	function(result){	
		var prediction = {
			'labels':[]
		};
		prediction[country] = [];
		if(typeof result.predictedEmployment != 'undefined' && result.predictedEmployment.length > 0){
			
			for(var i=0; i < result.predictedEmployment.length; i++){
				var item = result.predictedEmployment[i];
				if(typeof item.year != 'undefined'){
					var year = item.year-0;
					if(year >= min_year && year <= max_year){
						if(country == 'NI'){
							if(typeof item['breakdown'] != 'undefined'){
								for(var j=0; j < item['breakdown'].length; j++){
									var item2 = item['breakdown'][j];
									if(typeof item2['code'] != 'undefined' && typeof item2['employment'] != 'undefined'){
										var code = item2['code'];
										if(code == '12'){
											prediction[country].push({
												x:year,
												y:item2['employment'].toFixed(0)-0
											});
										}
									}							
								}
								prediction['labels'].push(year);
							}
						}else if(country == 'UK'){
							if(typeof item['employment'] != 'undefined'){
								prediction[country].push({
									x:year,
									y:item['employment'].toFixed(0)-0
								});
								prediction['labels'].push(year);
							}
						}
					}
				}
			}
			
		}
		searches[search_value][search_id]['prediction_'+country] = prediction;
		create_job_future(prediction,country);		
	},
	'json'
);
ajax.fail(function(){
	$_job_future_ni.html(empty_result_msg);
});
}
/* create job future */
function create_job_future(data,country){
if(data[country].length && data['labels'].length > 0){
	if(country == 'NI')
		$_job_future_ni.html('<canvas id="job_future_chart_'+country+'" ></canvas>');
	else
		$_job_future_uk.html('<canvas id="job_future_chart_'+country+'" ></canvas>');
	var color = (country == 'NI')?NI_color:UK_color;
	new Chart($('#job_future_chart_'+country).get(0).getContext("2d"),{
		type: 'line',
		data:{
			color_text: color,
			labels: data['labels'],
			datasets: [
			{
				label: (country == 'NI')?'N.Ireland':'UK',
				fill: false,
				borderColor: color,
				data: data[country]
			}
			]
		},
		options: {
			responsive: true,			
			scales: {
				xAxes: [{
					type: 'linear',
					position: 'bottom'
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Number of Jobs'
					}
				}]
			},
			tooltips: {
				enabled: false
			},
			hover: {
				animationDuration: 0
			},
			animation:{
				animateRotate: false,
				animateScale: false,
				duration: 0,
				onComplete: function(){
					draw_value(this);
				}
			}
		}
	});
}else{
	if(country == 'NI')
		$_job_future_ni.html(empty_result_msg);
	else
		$_job_future_uk.html(empty_result_msg);
}
}
/* draw value */
function draw_value(t){
	var ctx = t.chart.ctx;
	ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
	ctx.fillStyle = t.data.color_text;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'bottom';
	t.data.datasets.forEach(function (dataset) {
		for (var i = 0; i < dataset.data.length; i++) {
			var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
			ctx.fillText(dataset.data[i].y, model.x, model.y - 5);
		}
	}); 
}

/* GENDER */
/* read gender */
function read_gender(soc){
if(typeof searches[search_value][search_id]['gender'] != 'undefined'){
	create_gender(searches[search_value][search_id]['gender']);
	return;
}
$_gender.html(loading_msg);
var ajax = $.get(
	wf_gender_url,
	{
		soc: soc,
		minYear: min_year,
		maxYear: min_year
	},
	function(result){	
		var gender = {
			'male': '',
			'female': ''
		};
		if(typeof result.predictedEmployment != 'undefined' && result.predictedEmployment.length > 0){
			for(var i=0; i < result.predictedEmployment.length; i++){
				var item = result.predictedEmployment[i];
				if(typeof item.year != 'undefined'){
					var year = item.year-0;
					if(year == min_year){
						if(typeof item['breakdown'] != 'undefined'){
							var total = 0;
							for(var j=0; j < item['breakdown'].length; j++){
								var item2 = item['breakdown'][j];
								if(typeof item2['code'] != 'undefined' && typeof item2['employment'] != 'undefined'){
									var code = item2['code'];
									if(code == '1'){
										gender['male'] = item2['employment'];
									}else if(code == '2'){
										gender['female'] = item2['employment'];
									}
								}							
							}
						}
					}
				}
			}			
		}
		searches[search_value][search_id]['gender'] = gender;
		create_gender(gender);
	},
	'json'
);
ajax.fail(function(){
	$_gender.html(empty_result_msg);
});
}
/* create gender */
function create_gender(data){
if(data.mail != '' && data.femail != ''){
	$_gender.html('<canvas id="gender_chart" ></canvas>');
	var total = parseFloat(data.male)+parseFloat(data.female);
	var male = parseInt((data.male-0)/total*100);
	new Chart($("#gender_chart").get(0).getContext("2d"),{
		type: 'bar',
		data:{
			labels: [
				'Male ('+male+'%)',
				'Female ('+(100-male)+'%)'
			],
			display: false,
			datasets: [{
				data: [male, 100-male],
				backgroundColor: [
					gender_mail_color,
					gender_femail_color	
				],
				hoverBackgroundColor: [
					gender_mail_color,
					gender_femail_color							
				]
			}]
		},
		options: {
			responsive: true,	
			maintainAspectRatio: true,	
			animation:{
				duration: 0
			},
			scales: {
				margins: {
					left: -20
				},
				yAxes: [{
					ticks: {
						beginAtZero:true
					},
					scaleLabel: {
						display: true,
						labelString: 'Percent'
					}
				}]
			},
			legend:{
				display: false,
			},
			tooltips: {
				enabled: false
			}
		}
	});
}else{
	$_gender.html(empty_result_msg);
}
}

/* INDUSTRY */
/* read industry */
function read_industry(soc){
if(typeof searches[search_value][search_id]['industry'] != 'undefined'){
	create_industry(searches[search_value][search_id]['industry']);
	return;
}
$_industry.html(loading_msg);
var ajax = $.get(
	wf_industry_url,
	{
		soc: soc,
		minYear: min_year,
		maxYear: min_year
	},
	function(result){	
		var industry = [];
		if(typeof result.predictedEmployment != 'undefined' && result.predictedEmployment.length > 0){
			for(var i=0; i < result.predictedEmployment.length; i++){
				var item = result.predictedEmployment[i];
				if(typeof item.year != 'undefined'){
					var year = item.year-0;
					if(year == min_year){
						if(typeof item['breakdown'] != 'undefined'){
							var total = 0;
							for(var j=0; j < item['breakdown'].length; j++){
								var item2 = item['breakdown'][j];
								if(typeof item2['name'] != 'undefined' && typeof item2['employment'] != 'undefined'){
									var o = {
										name: item2['name'],
										employment: item2['employment']-0
									}
									industry.push(o);
								}				
							}
						}
					}
				}
			}
			if(industry.length > 0){
				industry.sort(function(a,b){
					return b.employment - a.employment;
				});
			}
			searches[search_value][search_id]['industry'] = industry;
			create_industry(industry);
		}		
	},
	'json'
);
ajax.fail(function(){
	$_industry.html(empty_result_msg);
});
}
/* create industry */
function create_industry(data){
	var html = '';	
	var total_employment = 0;
	for(var i=0; i < data.length; i++){
		total_employment += (data[i]['employment']-0);
	}
	for(var i=0; i < data.length; i++){		
		if(i>=10)break;
		html += '<tr>';
		html += '<td class="col1">'+(i+1)+'.</td>';
		html += '<td class="col2">'+data[i]['name']+'</td>';
		html += '<td class="col3">'+(((data[i]['employment']-0)/total_employment)*100).toFixed(2)+'</td>';
		html += '</tr>';
	}
	if(data.length>0){
		$_industry.html('<table><tr><th>&nbsp;</th><th>Industry</th><th>Jobs (%)</th></tr>'+html+'</table>');
	}else{
		$_industry.html(empty_result_msg);
	}
}
}

/* trim */
if(!String.prototype.trim){
	String.prototype.trim = function(){
		return this.replace(/^\s+|\s+$/gm,'');
	}
}
