// Custom scanline & vignette overlay shader reference
varying vec2 vUv;
uniform sampler2D tDiffuse;
void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  float scanline = sin(vUv.y * 480.0) * 0.04;
  gl_FragColor = vec4(color.rgb - scanline, 1.0);
}
