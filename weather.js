let weather;

//loader
function configLoader(weather, loader){
	setCardDisplay('#weather-card', weather);
    setCardDisplay('#loading-card', loader);	
}

function setCardDisplay(selector, visible) {
	if(selector === '#weather-card')	
  		document.querySelector(selector).style.display = visible ? 'block' : 'none';
  	if(selector === '#loading-card')
  		document.querySelector(selector).style.display = visible ? 'flex' : 'none';
}

//search function
document.querySelector('#srch-box').addEventListener('keyup', (event) => {
	event.preventDefault();
	if (event.keyCode === 13) {
		callFunctionOrder({loc: document.querySelector('#srch-box').value});		
	}
});

//initial call
document.body.onload = () => callFunctionOrder({});

function toggleDegreeType(event){
	let toggleBtn = document.querySelector('.degree-toggle');
	let toggleWheel = document.querySelector('.toggle-wheel');
	let toggleWheelSpan = document.querySelector('.toggle-wheel span');
	if(event.target != toggleBtn){
		return;	
	}

	toggleWheel.classList.toggle('toggle-wheel-translate');
	let type = toggleWheelSpan.innerHTML;
	toggleWheelSpan.innerHTML  = (type == '°C')? '°F' : '°C';

	changeDegreeType((type == '°C')? 'fah': 'cel');
}

function changeDegreeType(type){
	let currentCel = document.querySelector('.cel');
	let currentFah = document.querySelector('.fah');
	let cel = document.querySelectorAll('.text-cel');
	let fah = document.querySelectorAll('.text-fah');
	let celChart = document.querySelector('#celcius-chart');
	let fahChart = document.querySelector('#fah-chart');
	let celChartTranslatePosition = document.querySelector('#celcius-chart').style.transform;
	let fahChartTranslatePosition = document.querySelector('#fah-chart').style.transform;
	if(type == 'fah'){
		currentCel.style.display = 'none';
		currentFah.style.display = 'block';
		cel[0].style.display = 'none';
		fah[0].style.display = 'block';
		cel[1].style.display = 'none';
		fah[1].style.display = 'block';
		cel[2].style.display = 'none';
		fah[2].style.display = 'block';
		celChart.style.cssText = `display: none !important; transform: ${celChartTranslatePosition}`;
		fahChart.style.cssText = `display: block !important; transform: ${fahChartTranslatePosition}`;
		return;
	}

	currentCel.style.display = 'block';
	currentFah.style.display = 'none';
	cel[0].style.display = 'block';
	fah[0].style.display = 'none';
	cel[1].style.display = 'block';
	fah[1].style.display = 'none';
	cel[2].style.display = 'block';
	fah[2].style.display = 'none';
	celChart.style.cssText = `display: block !important; transform: ${celChartTranslatePosition}`;
	fahChart.style.cssText = `display: none !important; transform: ${fahChartTranslatePosition}`;
}

//API request
async function weatherApiRequest(location){
	let options = {
		method: 'GET',
		headers: {
			'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com',
			'X-RapidAPI-Key': '67ae7390a1msh85c4d35ad6aba1bp17e9afjsnf3966894634e'
		}
	};
	configLoader(false, true);
	let response = await fetch(`https://weatherapi-com.p.rapidapi.com/forecast.json?q=${location}&days=7`, options);
	let result;
	if(response.ok){
		result = await response.json();	
	}else{
		alert('Location not found');
		throw new Error('Location not found');
	}
	return result;
}


function getHostGeolocation(){	
	let location = '';

	let options = {
	  enableHighAccuracy: true,
	  timeout: 5000,
	  maximumAge: 0
	};

	function success(position){
		location = position.coords.latitude + ',' + position.coords.longitude;
		callFunctionOrder({loc: location});
	}

	function error(err){
		console.log(err);
	}

	try{
		navigator.geolocation.getCurrentPosition(success, error, options);	
	}catch(err){
		console.log(err);
	}	
	
}


function callFunctionOrder({loc = ''}){
	if(loc == ''){
		getHostGeolocation();
	}else{
		weather = weatherApiRequest(loc).then(result => result);
		displayWeatherInfo(weather); 
		createChart(weather, 'celcius', 0, 0);
		createChart(weather, 'fah', 0, 1);
		createChart(weather, 'humidity', 0, 2);
		createChart(weather, 'wind', 0, 3);
		getDaysToFollow(weather);
	}
}

function displayWeatherInfo(weather){
	weather.then(
		(response) => {
			let txtCelcius = document.querySelector('.text-degree .cel');
			let txtFah = document.querySelector('.fah');
			let txtPrecep = document.querySelector('.text-precep');
			let txtHumidity = document.querySelector('.text-humidity');
			let txtWind = document.querySelector('.text-wind');
			let txtLoc = document.querySelector('.text-loc');
			let txtDay = document.querySelector('.text-day');
			let txtWeather = document.querySelector('.text-weather');
			let weatherImg = document.querySelector('.text-degree img');
			txtCelcius.innerHTML  = response.current.feelslike_c + '°C';
			txtFah.innerHTML  = response.current.feelslike_f + '°F';
			weatherImg.src = response.current.condition.icon;
			txtPrecep.innerHTML  = 'Precipation: ' + response.current.precip_in + '%';
			txtHumidity.innerHTML  = 'Humidity: ' + response.current.humidity + '%';
			txtWind.innerHTML  = 'Wind: ' + response.current.wind_kph + 'km/h';
			txtLoc.innerHTML  = response.location.name +', '+ response.location.region;
			txtDay.innerHTML  = getDayText(new Date(response.location.localtime).getDay());
			txtWeather.innerHTML  = response.current.condition.text;
			configLoader(true, false);
			textFit(document.querySelector('.text-loc'), {widthOnly: true});
			
		}	
	);
}

let chart = []
function createChart(weather, ctype, indx, cIndx){
	weather.then((response)=>{
		let chartData = setChartData(weather, ctype, indx);
		let label = (ctype == 'celcius')? 'Celcius' : (ctype == 'fah')? 'Fahrenheit': (ctype == 'humidity')? 'Percent' : 'kph';  
		let backColor = (ctype == 'celcius' || ctype == 'fah')? '255, 204, 0, ' : '26, 115, 232, '; 
		chartData.then(chartData => {
			const ctx = document.getElementById(`${ctype}-chart`).getContext('2d');
			if(chart[cIndx] != undefined) chart[cIndx].destroy();
			chart[cIndx] = new Chart(ctx, {
			    type: 'line',
			    data: {
			        labels: ['9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM', '6 AM'],
			        datasets: [{
			        	label: label,
			            data: chartData,
			            backgroundColor: [
			                 `rgba(${backColor}0.2)`
			            ],
			            borderColor: [
			                 `rgba(${backColor}1)`
			            ],
			            cubicInterpolationMode: 'monotone',
			            borderWidth: 2,
			            fill: true,
			        }]
			    },
			    options: {
			    	plugins: {
	           			 legend: {
	                		display: false
	            		},
	            		tooltips: {
	        				callbacks: {
	           					label: function(tooltipItem) {
	                  				return tooltipItem.yLabel;
	           					}
	        				}
	    				}
	        		},
	        		scales: {
	        			x: {
	        				grid: {
	        					display: false,
	        					borderColor: 'white'
	        				}
	        			},
	        			y: {
	        				grid: {
	        					display: false,
	        					borderColor: 'white'
	        				},
	        				ticks: {
	        					display: false
	        				}
	        			}
	        		},
	        		
			    	responsive : true,	      		
			    }
			});
		
		});
	});

}


function setChartData(weather, ctype, indx){
	return weather.then((response) => {
		let chartData = [];
		if(ctype == 'celcius'){
			chartData.push(response.forecast.forecastday[indx].hour[9].temp_c);
			chartData.push(response.forecast.forecastday[indx].hour[12].temp_c);
			chartData.push(response.forecast.forecastday[indx].hour[15].temp_c);
			chartData.push(response.forecast.forecastday[indx].hour[18].temp_c);
			chartData.push(response.forecast.forecastday[indx].hour[21].temp_c);
			chartData.push(response.forecast.forecastday[indx].hour[0].temp_c);
			chartData.push(response.forecast.forecastday[indx].hour[6].temp_c);
		}else if(ctype == 'fah'){
			chartData.push(response.forecast.forecastday[indx].hour[9].temp_f);
			chartData.push(response.forecast.forecastday[indx].hour[12].temp_f);
			chartData.push(response.forecast.forecastday[indx].hour[15].temp_f);
			chartData.push(response.forecast.forecastday[indx].hour[18].temp_f);	
			chartData.push(response.forecast.forecastday[indx].hour[21].temp_f);
			chartData.push(response.forecast.forecastday[indx].hour[0].temp_f);
			chartData.push(response.forecast.forecastday[indx].hour[6].temp_f);
		}else if(ctype == 'humidity'){
			chartData.push(response.forecast.forecastday[indx].hour[9].humidity);
			chartData.push(response.forecast.forecastday[indx].hour[12].humidity);
			chartData.push(response.forecast.forecastday[indx].hour[15].humidity);
			chartData.push(response.forecast.forecastday[indx].hour[18].humidity);	
			chartData.push(response.forecast.forecastday[indx].hour[21].humidity);
			chartData.push(response.forecast.forecastday[indx].hour[0].humidity);
			chartData.push(response.forecast.forecastday[indx].hour[6].humidity);
		}else{
			chartData.push(response.forecast.forecastday[indx].hour[9].wind_kph);
			chartData.push(response.forecast.forecastday[indx].hour[12].wind_kph);
			chartData.push(response.forecast.forecastday[indx].hour[15].wind_kph);
			chartData.push(response.forecast.forecastday[indx].hour[18].wind_kph);	
			chartData.push(response.forecast.forecastday[indx].hour[21].wind_kph);
			chartData.push(response.forecast.forecastday[indx].hour[0].wind_kph);
			chartData.push(response.forecast.forecastday[indx].hour[6].wind_kph);
		}
		
		return chartData;
	});
}


function getDaysToFollow(weather, indx){
	weather.then(response=>{
		let day1 = response.forecast.forecastday[0];
		let day2 = response.forecast.forecastday[1];
		let day3 = response.forecast.forecastday[2];
		
		let day = document.querySelectorAll('.text-ff-day');
		let cel = document.querySelectorAll('.text-cel');
		let fah = document.querySelectorAll('.text-fah');
		let img = document.querySelectorAll('.days-box img');

		day[0].innerHTML = getDayText(new Date(day1.date).getDay()).slice(0,3);
		img[0].src = day1.day.condition.icon;
		cel[0].innerHTML =  day1.day.avgtemp_c + '°C';
		fah[0].innerHTML =  day1.day.avgtemp_f + '°F';
		
		let first = document.querySelector('div[data-day="first"]');
		first.onclick = () => {
			displayWeatherInfo(weather);
			createChart(weather, 'celcius', 0, 0);
			createChart(weather, 'fah', 0, 1);
			createChart(weather, 'humidity', 0, 2);
			createChart(weather, 'wind', 0, 3);	
			setTimeout(() => changeChartDisplay(), 0);
		};

		day[1].innerHTML = getDayText(new Date(day2.date).getDay()).slice(0,3);
		img[1].src = day2.day.condition.icon;
		cel[1].innerHTML =  day2.day.avgtemp_c + '°C';
		fah[1].innerHTML =  day2.day.avgtemp_f + '°F';
		let second = document.querySelector('div[data-day="second"]');
		second.onclick = () => {
			displayValueOnOtherDay(weather, 1);
			createChart(weather, 'celcius', 1, 0);
			createChart(weather, 'fah', 1, 1);
			createChart(weather, 'humidity', 1, 2);
			createChart(weather, 'wind', 1, 3);
			setTimeout(() => changeChartDisplay(), 0);
		};

		day[2].innerHTML = getDayText(new Date(day3.date).getDay()).slice(0,3);
		img[2].src = day3.day.condition.icon;
		cel[2].innerHTML =  day3.day.avgtemp_c + '°C';
		fah[2].innerHTML =  day3.day.avgtemp_f + '°F';
		let third = document.querySelector('div[data-day="third"]');
		third.onclick = () => {
			displayValueOnOtherDay(weather, 2);
			createChart(weather, 'celcius', 2, 0);
			createChart(weather, 'fah', 2, 1);
			createChart(weather, 'humidity', 2, 2);
			createChart(weather, 'wind', 2, 3);
			setTimeout(() => changeChartDisplay(), 0);
		};
	});
}

function changeChartDisplay(){
	let celChartDisplay = document.querySelector('#celcius-chart');
	let celChartTranslatePosition = document.querySelector('#celcius-chart').style.transform;
	let fahChartDisplay = document.querySelector('#fah-chart');
	let fahChartTranslatePosition = document.querySelector('#fah-chart').style.transform;
	let degreeType = document.querySelector('.type');
	if(degreeType.innerHTML == '°C'){
		celChartDisplay.style.cssText = `display: block !important; transform: ${celChartTranslatePosition}`;
		fahChartDisplay.style.cssText = `display: none !important; transform: ${fahChartTranslatePosition}`;
	}else{
		celChartDisplay.style.cssText = `display: none !important; transform: ${celChartTranslatePosition}`;
		fahChartDisplay.style.cssText = `display: block !important; transform: ${fahChartTranslatePosition}`;	
	} 
}

function displayValueOnOtherDay(weather, indx){
	weather.then(
		(response) => {
			let txtCelcius = document.querySelector('.text-degree .cel');
			let txtFah = document.querySelector('.text-degree .fah');
			let txtPrecep = document.querySelector('.text-precep');
			let txtHumidity = document.querySelector('.text-humidity');
			let txtWind = document.querySelector('.text-wind');
			let txtLoc = document.querySelector('.text-loc');
			let txtDay = document.querySelector('.text-day');
			let txtWeather = document.querySelector('.text-weather');
			let weatherImg = document.querySelector('.text-degree img');
			
			txtCelcius.innerHTML  = response.forecast.forecastday[indx].day.avgtemp_c + '°C';
			txtFah.innerHTML  = response.forecast.forecastday[indx].day.avgtemp_f + '°F';
			weatherImg.src = response.forecast.forecastday[indx].day.condition.icon;
			txtPrecep.innerHTML  = 'Precipation: ' + response.forecast.forecastday[indx].day.totalprecip_in + '%';
			txtHumidity.innerHTML  = 'Humidity: ' + response.forecast.forecastday[indx].day.avghumidity + '%';
			txtWind.innerHTML  = 'Wind: ' + response.forecast.forecastday[indx].day.maxwind_kph + 'km/h';
			txtLoc.innerHTML  = response.location.name +', '+ response.location.region;
			txtDay.innerHTML  = getDayText(new Date(response.forecast.forecastday[indx].date).getDay());
			txtWeather.innerHTML  = response.forecast.forecastday[indx].day.condition.text;
			textFit(document.querySelector('.text-loc'), {widthOnly: true});
			
		}	
	);
}

function getDayText(day){
	switch(day){
		case 0:
			return 'Sunday';
			break;
		case 1:
			return 'Monday';
			break;
		case 2: 
			return 'Tuesday';
			break;
		case 3: 
			return 'Wednesday';
			break;
		case 4: 
			return 'Thursday';
			break;
		case 5:
			return 'Friday';
			break;
		default:
			return 'Saturday';
	}
}