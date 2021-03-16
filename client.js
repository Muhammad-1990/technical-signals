const socket = io();

socket.emit("msg-from-web", "test msg from web");

socket.on("msg-from-server", function (data) {
  // console.log(data)
});

socket.on("candle-generated", function (data) {
  // console.log(data)
  data.candles.open.slice(Math.max(data.candles.open.length - 5, 0))
  .forEach((element, index) => {
    var x = document.getElementsByClassName("open")
    x[index].innerHTML= element
  });
  data.candles.close.slice(Math.max(data.candles.close.length - 5, 0))
  .forEach((element, index) => {
    var x = document.getElementsByClassName("close")
    x[index].innerHTML= element
  });
  data.candles.max.slice(Math.max(data.candles.max.length - 5, 0))
  .forEach((element, index) => {
    var x = document.getElementsByClassName("max")
    x[index].innerHTML= element
  });
  data.candles.min.slice(Math.max(data.candles.min.length - 5, 0))
  .forEach((element, index) => {
    var x = document.getElementsByClassName("min")
    x[index].innerHTML= element
  });
  data.indicators.adx.slice(Math.max(data.indicators.adx.length - 5, 0))
  .forEach((element, index) => {
      var x = document.getElementsByClassName("adx")
      x[index].innerHTML= element.adx
  });
  data.indicators.EightEMA.slice(Math.max(data.indicators.EightEMA.length - 5, 0))
  .forEach((element, index) => {
      var x = document.getElementsByClassName("ema8")
      x[index].innerHTML= element
  });
  data.indicators.ThirteenEMA.slice(Math.max(data.indicators.ThirteenEMA.length - 5, 0))
  .forEach((element, index) => {
      var x = document.getElementsByClassName("ema13")
      x[index].innerHTML= element
  });
  data.indicators.TwentyOneEMA.slice(Math.max(data.indicators.TwentyOneEMA.length - 5, 0))
  .forEach((element, index) => {
      var x = document.getElementsByClassName("ema21")
      x[index].innerHTML= element
  });
});