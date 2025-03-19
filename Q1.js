const margin = {top: 20, right: 100, bottom: 50, left: 200},
      width = 1650 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

const svg = d3.select("#chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const tooltip = d3.select("#tooltip");

d3.csv("data_ggsheet.csv").then(rawData => {
  rawData.forEach(d => {
    d["Thành tiền"] = +d["Thành tiền"];
  });

  const nestedData = d3.rollup(
    rawData,
    v => ({
      doanhSoBan: d3.sum(v, d => d["Thành tiền"]),
      maMatHang: v[0]["Mã mặt hàng"],
      maNhomHang: v[0]["Mã nhóm hàng"],
      nhomHang: v[0]["Tên nhóm hàng"]
    }),
    d => d["Tên mặt hàng"]
  );

  let data = Array.from(nestedData, ([tenMatHang, values]) => ({
    tenMatHang: `[${values.maMatHang}] ${tenMatHang}`,
    ...values
  }));

  data.sort((a, b) => b.doanhSoBan - a.doanhSoBan);

  const color = d3.scaleOrdinal()
                  .domain(data.map(d => d.maNhomHang))
                  .range(d3.schemeTableau10);

  const y = d3.scaleBand()
              .domain(data.map(d => d.tenMatHang))
              .range([0, height])
              .padding(0.2);

  const x = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.doanhSoBan)])
              .nice()
              .range([0, width]);

  svg.append("g").call(d3.axisLeft(y));

  svg.append("g")
     .attr("transform", "translate(0," + height + ")")
     .call(d3.axisBottom(x)
             .ticks(15)
             .tickFormat(d3.format(".1s"))
             .tickSizeOuter(0));

  svg.selectAll(".bar")
     .data(data)
     .enter()
     .append("rect")
     .attr("class", "bar")
     .attr("y", d => y(d.tenMatHang))
     .attr("x", 0)
     .attr("height", y.bandwidth())
     .attr("width", d => x(d.doanhSoBan))
     .attr("fill", d => color(d.maNhomHang))
     .on("mouseover", (event, d) => {
        tooltip.style("display", "block")
               .html(`Mặt hàng: <strong>${d.tenMatHang}</strong><br>
                      Nhóm hàng: [${d.maNhomHang}] ${d.nhomHang}<br>
                      Doanh số bán: ${d3.format(",.0f")(d.doanhSoBan)} `)
               .style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
     })
     .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
     })
     .on("mouseout", () => {
        tooltip.style("display", "none");
     });

  svg.selectAll(".label")
     .data(data)
     .enter()
     .append("text")
     .attr("x", d => x(d.doanhSoBan) - 5)
     .attr("y", d => y(d.tenMatHang) + y.bandwidth() / 2)
     .attr("dy", ".35em")
     .text(d => `${d3.format(",.0f")(d.doanhSoBan / 1_000_000)} triệu VND`)
     .style("fill", "white")
     .style("font-size", "12px")
     .style("text-anchor", "end");
});
