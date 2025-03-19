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
    d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
    d["Ngày"] = d["Thời gian tạo đơn"].getDate();
    d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1;
  });

  const nestedData = d3.rollups(
    rawData,
    v => {
      const doanhThuTong = d3.sum(v, d => d["Thành tiền"]);
      const skuTong = d3.sum(v, d => d["SL"]);
      const uniqueDates = d3.rollup(v, g => 1, d => `${d["Ngày"]}-${d["Tháng"]}`);
      const soNgayXuatHien = uniqueDates.size;

      return {
        doanhThuTrungBinh: doanhThuTong / soNgayXuatHien,
        skuTrungBinh: skuTong / soNgayXuatHien,
        tongDoanhThu: doanhThuTong,
        tongSL: skuTong,
        soNgay: soNgayXuatHien
      };
    },
    d => d["Ngày"]
  );

  const data = nestedData.map(([ngay, values]) => ({
    ngay: ngay,
    doanhThuTrungBinh: values.doanhThuTrungBinh,
    skuTrungBinh: values.skuTrungBinh,
    tongDoanhThu: values.tongDoanhThu,
    tongSL: values.tongSL,
    soNgay: values.soNgay
  }));

  data.sort((a, b) => a.ngay - b.ngay);

  const x = d3.scaleBand()
              .domain(data.map(d => d.ngay))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.doanhThuTrungBinh)])
              .nice()
              .range([height, 0]);

  const color = d3.scaleOrdinal()
                  .domain(data.map(d => d.ngay))
                  .range(d3.schemePaired);

  svg.append("g")
     .attr("transform", `translate(0, ${height})`)
     .call(d3.axisBottom(x).tickFormat(d => `Ngày ${String(d).padStart(2, '0')}`))
     .selectAll("text")
     .attr("transform", "rotate(-45)")
     .style("text-anchor", "end");

  svg.append("g")
     .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d / 1_000_000).toFixed(0)} M`));

  svg.selectAll(".bar")
     .data(data)
     .enter()
     .append("rect")
     .attr("class", "bar")
     .attr("x", d => x(d.ngay))
     .attr("y", d => y(d.doanhThuTrungBinh))
     .attr("width", x.bandwidth())
     .attr("height", d => height - y(d.doanhThuTrungBinh))
     .attr("fill", d => color(d.ngay))
     .on("mouseover", (event, d) => {
        tooltip.style("display", "block") // Hiển thị tooltip khi hover
          .html(`Ngày trong tháng: Ngày <strong>${d.ngay}</strong><br>
                 Doanh số bán TB: ${d3.format(",.0f")(d.doanhThuTrungBinh)} <br>`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
     })

     .on("mouseout", () => {
       tooltip.style("display", "none");
     });

  svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.ngay) + x.bandwidth() / 2)
    .attr("y", d => y(d.doanhThuTrungBinh) + 15)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style('fill', 'white')
    .text(d => `${(d.doanhThuTrungBinh / 1_000_000).toFixed(1)} tr`);

}).catch(error => {
  console.error("Lỗi khi load file CSV:", error);
});
