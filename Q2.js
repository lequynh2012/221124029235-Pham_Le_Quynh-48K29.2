
const margin = {top: 20, right: 100, bottom: 50, left: 200},
      width = 1650 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

const svg = d3.select("#chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

// [Q1] SECTION: LOAD DỮ LIỆU CSV
d3.csv("data_ggsheet.csv").then(rawData => {
  rawData.forEach(d => {
    d["Thành tiền"] = +d["Thành tiền"];
  });

  const nestedData = d3.rollup(
    rawData,
    v => ({
      doanhThu: d3.sum(v, d => d["Thành tiền"]),
      maNhomHang: v[0]["Mã nhóm hàng"],
      tenNhomHang: v[0]["Tên nhóm hàng"]
    }),
    d => d["Tên nhóm hàng"]
  );

  const data = Array.from(nestedData, ([tenNhomHang, values]) => ({
    tenNhomHang: `[${values.maNhomHang}] ${tenNhomHang}`,
    ...values
  }));

  data.sort((a, b) => b.doanhThu - a.doanhThu);


  const color = d3.scaleOrdinal()
                  .domain(data.map(d => d.maNhomHang))
                  .range(d3.schemeTableau10);

  const y = d3.scaleBand()
              .domain(data.map(d => `[${d.maNhomHang}] ${d.tenNhomHang}`))
              .range([0, height])
              .padding(0.2);

  const x = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.doanhThu)])
              .nice()
              .range([0, width]);

  // [Q1] SECTION: VẼ TRỤC
  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
     .attr("transform", `translate(0, ${height})`)
     .call(d3.axisBottom(x)
             .ticks(10)
             .tickFormat(d => (d / 1000000) + "M")
             .tickSizeOuter(0));


  svg.selectAll(".bar")
     .data(data)
     .enter()
     .append("rect")
     .attr("class", "bar")
     .attr("y", d => y(`[${d.maNhomHang}] ${d.tenNhomHang}`))
     .attr("x", 0)
     .attr("height", y.bandwidth())
     .attr("width", d => x(d.doanhThu))
     .attr("fill", d => color(d.maNhomHang))

     .on("mouseover", (event, d) => {
       tooltip.style("display", "block")
         .html(`Nhóm hàng: <strong>[${d.maNhomHang}] ${d.tenNhomHang}</strong><br>
                Doanh số bán: ${d3.format(",.0f")(d.doanhThu)} `)
         .style("left", (event.pageX + 10) + "px")
         .style("top", (event.pageY - 20) + "px");
     })

     .on("mouseout", () => {
       tooltip.style("display", "none");
     });

  const formatMillion = d3.format(",.0f");
  svg.selectAll(".label")
     .data(data)
     .enter()
     .append("text")
     .attr("x", d => x(d.doanhThu) - 10)
     .attr("y", d => y(`[${d.maNhomHang}] ${d.tenNhomHang}`) + y.bandwidth() / 2)
     .attr("dy", "0.35em")
     .attr("text-anchor", "end")
     .style("fill", "white")
     .style("font-size", "14px")
     .text(d => formatMillion(d.doanhThu / 1_000_000) + " triệu VND");
}).catch(error => {
  console.error("Lỗi khi load file CSV:", error);
});
