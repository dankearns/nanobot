

fourier = require 'fourier'
TWOPI = Math.PI*2
arrsum = (arr) -> arr.reduce( ((m,i) -> m+i) , 0)


whiteGaussianNoise = (mean=0, stdev=1, N=37) -> ->
  x = 0
  for i in [1..N]
    u = Math.random()
    x = x+u

  # set mean to 0
  x = x - N/2

  # set variance to 1
  x = x * Math.sqrt(12 / N)
  return mean + x * stdev

# http://paulbourke.net/fractals/noise/
# Quick summary:
# Brown (brownian) noise: beta is the slope of log(power) vs log(freq)
# beta=0 is white noise
# beta=1 is pink "1/f" noise
# beta=2 is "brown noise"
# This is called the fBm method (make power spectrum, then ift to get values)
betaNoise = (mean=0, beta=2, window=8192) ->
  awgn = whiteGaussianNoise()
  newBuffer = ->
    real = [0]
    imag = [0]
    len = window/2
    for i in [1..len]
      mag = Math.pow(i+1.0,-beta/2) * awgn()
      pha = TWOPI * Math.random()
      real[i] = mag * Math.cos(pha)
      imag[i] = mag * Math.sin(pha)
      real[window-i] = real[i]
      imag[window-i] = -imag[i]
    imag[len] = 0
    series = fourier.idft real, imag
    return series
  buffer = newBuffer()[0]
  index = 0
  (t) ->
    if ++index is buffer.length
      index = 0
      buffer = newBuffer()[0]
    return mean + buffer[index]

# pink noise via filtering white noise
pinkNoise = (mean, stdev, N) ->
  white = whiteGaussianNoise mean, stdev, N
  filt = [0,0,0,0,0,0]
  coeff = [[0.997,0.029591],[0.985,0.032534],[0.950,0.048056],[0.850,0.090579],[0.620,0.108990],[0.250,0.255784]]
  update = (w) ->
    for i in [0..5]
      cv = coeff[i]
      filt[i] = filt[i]*cv[0] + w*cv[1]
    return filt
  (t) ->
    w = white()
    0.55 * arrsum(update w)

# pink noise via frequency-staggered sample-and-hold
pinkNoise2 = (mean=0) ->
  N = 5
  # amplitude scaling
  pA =   [3.8024,2.9694,2.5970,3.0870,3.4006]
  # probability of update
  pP =   [0.00198,0.01280,0.04900,0.17000,0.68200]
  # cumulative probability of update
  pSUM = [0.00198,0.01478,0.06378,0.23378,0.91578]
  contrib = (Math.random() for i in [1..N])

  ->
    ur1 = Math.random()
    for stage in [0..(N-1)]
      if (ur1 <= pSUM[stage])
         ur2 = Math.random()
         contrib[stage] = 2*(ur2-0.5)*pA[stage]
         break
    mean + arrsum(contrib)/N

exports.generators =
  # bernoulli process for parameter p: 0 < p < 1
  bernoulli: (p,center=false) -> ->
    if center
      if (Math.random() < p) then 1 else -1
    else
      if (Math.random() < p) then 1 else 0

  coswave: (amp=1,freq=1,phase=0) ->
    (t) -> amp * Math.cos(Math.PI*2*freq*t + phase)

  sinwave: (amp=1,freq=1,phase=0) ->
    (t) -> amp * Math.sin(Math.PI*2*freq*t + phase)

  sawtooth: (amp=1,freq=1,phase=0) ->
    (t) ->
      v = t * freq + phase
      amp * 2 * (v - Math.floor(0.5 + v))

  chirp: (amp=1,fMin=1,fMax=50,chirpTime=30,phase=0) ->
    (t) ->
      nt = t % chirpTime
      k = (fMax-fMin)/chirpTime
      amp * Math.sin(Math.PI*2*(fMin*nt + k*nt*nt/2) + phase)

  # normal distribution approximator based on N uniform
  # values, where 3 and 12 are good choices for n.
  normal: (mean=0, stdev=1, n=12) ->
    size = Math.ceil(Number(n))
    mean = Number(mean)
    stdev = Number(stdev)
    th = size/2
    (t) ->
      x = 0
      x += Math.random() for i in [0..size]
      mean + stdev*(x - th)

  awgn: whiteGaussianNoise
  pink1: pinkNoise
  pink2: pinkNoise2
  beta: betaNoise

exports.viewers =
  identity: -> (v) -> v
  amp: (amplitude) -> (v) -> v*amplitude
  noise: (amplitude=1) -> (v) -> (v + (Math.random()-0.5)*amplitude)
  limit: (min=-1,max=1) -> (v) ->
    v = if v < min then min else v
    v = if v > max then max else v
    return v
  # Turn v into a history[size] and return the mean
  slidingMean: (size) ->
    buf = (0 for x in [1..size])
    i = 0
    (v) ->
      buf[i++ % buf.length] = v
      arrsum(buf)/size
  # 1st-order Markov / Random-walk
  walk: ->
    last = 0
    (v) -> last += v
  # make happier numbers
  toFixed: (digits) -> (v) -> v.toFixed(digits)
  chain: (fns) -> (v) -> fns.reduce ((memo,fn) -> fn memo), v
