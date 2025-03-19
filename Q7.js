const margin = {top: 20, right: 100, bottom: 50, left: 200},
      width = 1650 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

const svg = d3.select("#chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

d3.csv("data_ggsheet.csv").then(rawData => {
  const totalOrders = new Set(rawData.map(d => d["Mã đơn hàng"])).size;
  const nestedData = d3.rollup(
    rawData,
    v => ({ count: new Set(v.map(d => d["Mã đơn hàng"])).size, total: v.length }),
    d => d["Mã nhóm hàng"],
    d => d["Tên nhóm hàng"]
  );

  let data = [];
  nestedData.forEach((tenNhom, maNhom) => {
    tenNhom.forEach((stats, tenNhomHang) => {
      data.push({
        MaNhomHang: maNhom,
        Tennhomhang: tenNhomHang,
        probability: stats.count / totalOrders
      });
    });
  });

  data.sort((a, b) => b.probability - a.probability);
  data.forEach(d => d.label = `[${d.MaNhomHang}] ${d.Tennhomhang}`); // Định dạng lại label

  const color = d3.scaleOrdinal()
                  .domain(data.map(d => d.Tennhomhang))
                  .range(d3.schemeTableau10);

  const y = d3.scaleBand()
              .domain(data.map(d => d.label))
              .range([0, height])
              .padding(0.2);

  const x = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.probability)])
              .nice()
              .range([0, width]);

  svg.append("g").call(d3.axisLeft(y));
  svg.append("g")
     .attr("transform", `translate(0, ${height})`)
     .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));

  svg.selectAll(".bar")
     .data(data)
     .enter()
     .append("rect")
     .attr("class", "bar")
     .attr("y", d => y(d.label))
     .attr("x", 0)
     .attr("height", y.bandwidth())
     .attr("width", d => x(d.probability))
     .attr("fill", d => color(d.Tennhomhang))
     .on("mouseover", function(event, d) {
        tooltip.style("display", "block")
               .html(`Nhóm hàng: <strong>${d.label}</strong><br>
                      Xác suất bán:</strong> ${d3.format(".0%")(d.probability)}`);
        d3.select(this).style("opacity", 0.7);
     })
     .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 20) + "px");
     })
     .on("mouseout", function() {
        tooltip.style("display", "none");
        d3.select(this).style("opacity", 1);
     });

  svg.selectAll(".label")
     .data(data)
     .enter()
     .append("text")
     .attr("x", d => x(d.probability) - 35)
     .attr("y", d => y(d.label) + y.bandwidth() / 2)
     .attr("dy", "0.35em")
     .attr("text-anchor", "middle")
     .attr("fill", "white")
     .text(d => d3.format(".1%")(d.probability));

}).catch(error => {
  console.error("Lỗi khi load file CSV:", error);
});
