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

d3.csv("data_ggsheet.csv").then(rawData => {
  rawData.forEach(d => {
    d["Thành tiền"] = +d["Thành tiền"];
    d["SL"] = +d["SL"];
    d.Tháng = `Tháng ${d["Thời gian tạo đơn"].split("-")[1]}`;
  });

  const nestedData = d3.rollup(
    rawData,
    v => ({
      doanhThu: d3.sum(v, d => d["Thành tiền"]),
      soLuong: d3.sum(v, d => d["SL"])
    }),
    d => d.Tháng
  );

  const data = Array.from(nestedData, ([Tháng, {doanhThu, soLuong}]) => ({ Tháng, doanhThu, soLuong }));
  data.sort((a, b) => a.Tháng.localeCompare(b.Tháng, 'vi', { numeric: true }));

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  const x = d3.scaleBand()
              .domain(data.map(d => d.Tháng))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.doanhThu)])
              .nice()
              .range([height, 0]);

  svg.append("g")
     .attr("transform", `translate(0, ${height})`)
     .call(d3.axisBottom(x))
     .append("text")
     .attr("x", width / 2)
     .attr("y", 40)
     .attr("fill", "black")
     .attr("text-anchor", "middle");

  svg.append("g")
     .call(d3.axisLeft(y)
             .ticks(9)
             .tickFormat(d3.format(".1s"))
             .tickSizeOuter(0));

  svg.selectAll(".bar")
     .data(data)
     .enter()
     .append("rect")
     .attr("class", "bar")
     .attr("x", d => x(d.Tháng))
     .attr("y", d => y(d.doanhThu))
     .attr("width", x.bandwidth())
     .attr("height", d => height - y(d.doanhThu))
     .attr("fill", d => color(d.Tháng))
     .on("mouseover", (event, d) => {
       tooltip.style("display", "block")
              .html(`Tháng: <strong>${d.Tháng}</strong><br>
                    Doanh số bán: ${d3.format(",.0f")(d.doanhThu)}`)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
     })
     .on("mousemove", event => {
       tooltip.style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
     })
     .on("mouseout", () => {
       tooltip.style("display", "none");
     });

  svg.selectAll(".label")
     .data(data)
     .enter()
     .append("text")
     .attr("x", d => x(d.Tháng) + x.bandwidth() / 2)
     .attr("y", d => y(d.doanhThu) + 15)
     .attr("text-anchor", "middle")
     .style('font-size','10px')
     .style('fill', 'white')
     .text(d => `${d3.format(",.0f")(d.doanhThu / 1_000_000)} triệu VND`);
}).catch(error => {
  console.error("Lỗi khi load file CSV:", error);
});
